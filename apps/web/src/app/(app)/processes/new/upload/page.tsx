"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch, apiUpload } from "@/lib/api-client";
import { defaultExecutionSchedule } from "@/lib/execution-schedule";

type TenantFunction = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

export default function UploadProcessPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [functionId, setFunctionId] = useState("");
  const [processAreaId, setProcessAreaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ functions: TenantFunction[] }>("/tenants/profile")
      .then((profile) => {
        setFunctions(profile.functions ?? []);
        const first = profile.functions?.[0];
        if (first) {
          setFunctionId(first.id);
          setProcessAreaId(first.areas[0]?.id ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const areas = functions.find((fn) => fn.id === functionId)?.areas ?? [];

  async function onSubmit() {
    if (!file || !functionId || !processAreaId) {
      setError("Choose a file, function, and process area.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "Uploaded SOP";
      const created = await apiFetch<{ id: string }>("/processes", {
        method: "POST",
        body: JSON.stringify({
          functionId,
          processAreaId,
          name: baseName,
          purpose: baseName,
          reviewFrequency: "annually",
          executionSchedule: defaultExecutionSchedule,
          creationSource: "manual",
        }),
      });

      const formData = new FormData();
      formData.append("file", file);
      await apiUpload(`/processes/${created.id}/documents`, formData);
      router.push(`/processes/${created.id}/edit`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Upload SOP"
        description="Create a draft process and attach your source document. You can enrich fields in the editor next."
      />

      <div className="max-w-xl space-y-4 rounded-lg border border-border bg-white p-6">
        {loading ? (
          <p className="text-sm text-text-muted">Loading tenant scaffold…</p>
        ) : (
          <>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Document</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                data-testid="new-upload-file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Function</span>
              <select
                value={functionId}
                onChange={(event) => {
                  setFunctionId(event.target.value);
                  const fn = functions.find((item) => item.id === event.target.value);
                  setProcessAreaId(fn?.areas[0]?.id ?? "");
                }}
                className="h-10 rounded-md border border-border px-3"
              >
                {functions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Process area</span>
              <select
                value={processAreaId}
                onChange={(event) => setProcessAreaId(event.target.value)}
                className="h-10 rounded-md border border-border px-3"
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <PrimaryButton disabled={busy || loading} onClick={() => void onSubmit()}>
          {busy ? "Uploading…" : "Create draft & upload"}
        </PrimaryButton>
      </div>
    </>
  );
}
