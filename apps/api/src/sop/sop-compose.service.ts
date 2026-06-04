import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { guidanceDemoStore } from "../standards/guidance-demo.store";
import { StandardsService } from "../standards/standards.service";
import type { AuthUser } from "../auth/auth.types";
import { SopGenerationService } from "./sop-generation.service";
import {
  buildMockDraft,
  mergeGaps,
  normalizeGeneratedDraft,
  type SopGap,
} from "./sop.types";
import type {
  ComposeArtifact,
  ComposeDecision,
  ComposeSopInput,
  ComposeStreamEvent,
  ComposedStep,
} from "./sop-compose.types";

@Injectable()
export class SopComposeService {
  constructor(
    @Inject(SopGenerationService)
    private readonly generation: SopGenerationService,
    @Inject(StandardsService)
    private readonly standards: StandardsService,
  ) {}

  suggestStandards(user: AuthUser, functionId: string) {
    const profile = guidanceDemoStore.getOrganisationProfile(user.tenantId);
    const recommendations = this.standards.getRecommendations(user, {
      organisationType: profile.organisationType,
      country: profile.countries?.[0],
    });

    const selections = this.standards
      .listSelections(user)
      .filter((row) => row.selectionStatus === "relevant")
      .map((row) => ({
        packId: row.packId,
        packSlug: row.packSlug,
        packName: row.packName,
        selectionStatus: row.selectionStatus,
      }));

    const recommended = recommendations.map((pack) => {
      const full = guidanceDemoStore.getPackBySlug(pack.slug);
      return {
        packId: full?.id ?? pack.slug,
        slug: pack.slug,
        name: pack.name,
        summary: pack.summary,
      };
    });

    return {
      functionId,
      recommended,
      tenantSelections: selections,
      requireConfirmation: true,
    };
  }

  async transcribe(
    audio: Buffer,
    mimeType: string,
  ): Promise<{ transcript: string; artifactId: string }> {
    const artifactId = `audio-${Date.now()}`;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        artifactId,
        transcript:
          "Recorded walkthrough: staff receive the request, log it in the system, and escalate safeguarding concerns to the designated lead.",
      };
    }

    const form = new FormData();
    const blob = new Blob([audio], { type: mimeType || "audio/webm" });
    form.append("file", blob, "recording.webm");
    form.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI transcription failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { text?: string };
    return {
      artifactId,
      transcript: payload.text?.trim() || "",
    };
  }

  async *streamCompose(
    user: AuthUser,
    input: ComposeSopInput,
  ): AsyncGenerator<ComposeStreamEvent> {
    if (!input.confirmedPackIds?.length) {
      throw new Error("Confirm at least one standards pack before composing.");
    }

    const description = this.buildDescription(input.artifacts, input.resolutions);
    if (!description.trim()) {
      throw new Error("Add at least one text, file, transcript, or rough step.");
    }

    yield { type: "progress", message: "Synthesising SOP from your sources…" };

    const generated = await this.generation.generate({
      description,
      functionId: input.functionId,
      processAreaId: input.processAreaId,
      tenantContext: input.tenantContext ?? user.email,
    });

    const draft = normalizeGeneratedDraft(generated.draft);
    const primaryArtifactId = input.artifacts[0]?.id ?? "primary";
    const draftHash = createHash("sha256")
      .update(JSON.stringify({ description, packIds: input.confirmedPackIds }))
      .digest("hex")
      .slice(0, 16);

    for (const decision of this.detectDecisions(input.artifacts)) {
      yield { type: "decision", decision };
    }

    yield { type: "progress", message: "Aligning to selected standards…" };

    const alignmentGaps = this.buildAlignmentGaps(
      input.confirmedPackIds,
      draft,
    );

    for (const step of draft.steps) {
      const composed: ComposedStep = {
        ...step,
        is_control_point: step.evidence_required,
        provenance: [
          {
            artifactId: primaryArtifactId,
            label: input.artifacts[0]?.provenanceLabel ?? "Source material",
            excerpt: step.description.slice(0, 120) || undefined,
          },
        ],
      };
      yield { type: "step", step: composed };
    }

    const gaps = mergeGaps(draft);
    for (const gap of gaps) {
      yield { type: "gap", gap };
    }
    for (const gap of alignmentGaps) {
      yield { type: "gap", gap };
    }

    yield {
      type: "complete",
      draft,
      gaps,
      alignmentGaps,
      model: generated.model,
      draftHash,
    };
  }

  private buildDescription(
    artifacts: ComposeArtifact[],
    resolutions?: ComposeSopInput["resolutions"],
  ) {
    const parts: string[] = [];
    for (const artifact of artifacts) {
      if (artifact.kind === "rough_step") {
        parts.push(`Rough step: ${artifact.content ?? ""}`);
        continue;
      }
      if (artifact.content?.trim()) {
        parts.push(artifact.content.trim());
      }
    }

    if (resolutions?.length) {
      parts.push(
        "Resolved conflicts:\n" +
          resolutions
            .map(
              (row) =>
                `${row.field} = ${row.chosenValue} (from ${row.sourceArtifactId})`,
            )
            .join("\n"),
      );
    }

    return parts.join("\n\n");
  }

  private detectDecisions(artifacts: ComposeArtifact[]): ComposeDecision[] {
    const textArtifacts = artifacts.filter(
      (artifact) =>
        (artifact.kind === "text" || artifact.kind === "transcript") &&
        artifact.content?.trim(),
    );
    if (textArtifacts.length < 2) {
      return [];
    }

    const highRisk = textArtifacts.some((artifact) =>
      /safeguard|incident|emergency/i.test(artifact.content ?? ""),
    );
    const lowRisk = textArtifacts.some((artifact) =>
      /routine|administrative|low risk/i.test(artifact.content ?? ""),
    );

    if (highRisk && lowRisk) {
      return [
        {
          field: "risk_rating",
          options: ["medium", "high"],
          sourceArtifactIds: textArtifacts.map((artifact) => artifact.id),
          message:
            "Sources disagree on risk severity — choose the rating to apply.",
        },
      ];
    }

    return [];
  }

  private buildAlignmentGaps(
    packIds: string[],
    draft: ReturnType<typeof normalizeGeneratedDraft>,
  ): SopGap[] {
    const gaps: SopGap[] = [];

    for (const packId of packIds) {
      const pack =
        guidanceDemoStore.getPackById(packId) ??
        guidanceDemoStore.getPackBySlug(packId);
      if (!pack) {
        continue;
      }
      const requirements = guidanceDemoStore.listRequirements(pack.id);
      if (requirements.length > 0 && draft.steps.length < 2) {
        gaps.push({
          field: `alignment.${pack.slug}`,
          severity: "recommended",
          message: `Add steps that address ${pack.name} requirements before publishing.`,
        });
      }
      const firstReq = requirements[0];
      if (firstReq && !draft.description.toLowerCase().includes(pack.slug)) {
        gaps.push({
          field: `alignment.${pack.slug}.reference`,
          severity: "recommended",
          message: `Reference ${firstReq.title} from ${pack.name} in the SOP purpose or controls.`,
        });
      }
    }

    return gaps;
  }

  /** Exposed for tests — mock stream without LLM latency. */
  async *streamComposeMock(input: ComposeSopInput): AsyncGenerator<ComposeStreamEvent> {
    const description = this.buildDescription(input.artifacts);
    const draft = normalizeGeneratedDraft(
      buildMockDraft({
        description: description || "Mock composed process",
        functionId: input.functionId,
        processAreaId: input.processAreaId,
      }),
    );
    const draftHash = "mock-draft-hash";

    yield { type: "progress", message: "Mock compose…" };
    for (const step of draft.steps) {
      yield {
        type: "step",
        step: {
          ...step,
          is_control_point: step.evidence_required,
          provenance: [{ artifactId: "mock", label: "Mock source" }],
        },
      };
    }
    const gaps = mergeGaps(draft);
    for (const gap of gaps) {
      yield { type: "gap", gap };
    }
    yield {
      type: "complete",
      draft,
      gaps,
      alignmentGaps: [],
      model: "mock-compose",
      draftHash,
    };
  }
}
