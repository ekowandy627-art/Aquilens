import type { GeneratedSopDraft, SopGap } from "./sop.types";

export type ComposeArtifactKind =
  | "text"
  | "file"
  | "transcript"
  | "rough_step";

export type ComposeArtifact = {
  id: string;
  kind: ComposeArtifactKind;
  content?: string;
  filename?: string;
  provenanceLabel?: string;
};

export type ComposeSopInput = {
  functionId: string;
  processAreaId: string;
  confirmedPackIds: string[];
  artifacts: ComposeArtifact[];
  resolutions?: Array<{
    sourceArtifactId: string;
    field: string;
    chosenValue: string;
  }>;
  tenantContext?: string;
};

export type StepProvenance = {
  artifactId: string;
  label: string;
  excerpt?: string;
};

export type ComposedStep = {
  step_number: number;
  title: string;
  description: string;
  responsible_role: string;
  inputs: string;
  outputs: string;
  controls: string;
  step_type: "manual" | "approval";
  evidence_required: boolean;
  is_control_point?: boolean;
  provenance?: StepProvenance[];
};

export type ComposeDecision = {
  field: string;
  options: string[];
  sourceArtifactIds: string[];
  message: string;
};

export type ComposeStreamEvent =
  | { type: "progress"; message: string }
  | { type: "step"; step: ComposedStep }
  | { type: "gap"; gap: SopGap }
  | { type: "decision"; decision: ComposeDecision }
  | {
      type: "complete";
      draft: GeneratedSopDraft;
      gaps: SopGap[];
      alignmentGaps: SopGap[];
      model: string;
      draftHash: string;
    };

export type SaveResolutionInput = {
  sourceArtifactId: string;
  field: string;
  chosenValue: string;
  processId?: string;
  draftHash?: string;
};

export type SopResolutionRecord = {
  id: string;
  sourceArtifactId: string;
  field: string;
  chosenValue: string;
  processId?: string;
  draftHash?: string;
  createdAt: string;
};
