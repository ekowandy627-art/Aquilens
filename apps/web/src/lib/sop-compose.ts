import { resolveAuthToken } from "@/lib/api-client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

export type ComposeArtifact = {
  id: string;
  kind: "text" | "file" | "transcript" | "rough_step";
  content?: string;
  filename?: string;
  provenanceLabel?: string;
};

export type ComposeStreamEvent =
  | { type: "progress"; message: string }
  | {
      type: "step";
      step: {
        step_number: number;
        title: string;
        description: string;
        responsible_role: string;
        evidence_required: boolean;
        provenance?: Array<{ artifactId: string; label: string }>;
      };
    }
  | {
      type: "gap";
      gap: { field: string; severity: string; message: string };
    }
  | {
      type: "decision";
      decision: {
        field: string;
        options: string[];
        sourceArtifactIds: string[];
        message: string;
      };
    }
  | {
      type: "complete";
      draft: Record<string, unknown>;
      gaps: Array<{ field: string; severity: string; message: string }>;
      alignmentGaps: Array<{ field: string; severity: string; message: string }>;
      model: string;
      draftHash: string;
    }
  | { type: "error"; message: string };

export async function transcribeAudio(blob: Blob): Promise<{
  transcript: string;
  artifactId: string;
}> {
  const token = await resolveAuthToken();
  const form = new FormData();
  form.append("audio", blob, "recording.webm");

  const response = await fetch(`${apiBaseUrl}/sop/transcribe`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const body = (await response.json()) as {
    success: boolean;
    data?: { transcript: string; artifactId: string };
    error?: { message?: string };
  };

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? "Transcription failed");
  }

  return body.data;
}

export async function streamSopCompose(
  payload: {
    functionId: string;
    processAreaId: string;
    confirmedPackIds: string[];
    artifacts: ComposeArtifact[];
    resolutions?: Array<{
      sourceArtifactId: string;
      field: string;
      chosenValue: string;
    }>;
  },
  onEvent: (event: ComposeStreamEvent) => void,
) {
  const token = await resolveAuthToken();
  const response = await fetch(`${apiBaseUrl}/sop/compose`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(errBody?.error?.message ?? "Compose stream failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const event = JSON.parse(line) as ComposeStreamEvent;
      onEvent(event);
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as ComposeStreamEvent);
  }
}

export async function saveSopResolution(input: {
  sourceArtifactId: string;
  field: string;
  chosenValue: string;
  draftHash?: string;
  processId?: string;
}) {
  const token = await resolveAuthToken();
  const response = await fetch(`${apiBaseUrl}/sop/resolutions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as {
    success: boolean;
    error?: { message?: string };
  };
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? "Failed to save resolution");
  }
}
