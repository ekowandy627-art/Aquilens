"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { PermissionGate } from "@/components/auth/permission-gate";
import { apiFetch } from "@/lib/api-client";
import { AI_SOP_REVIEW_STORAGE_KEY } from "@/lib/ai-sop-storage";

type TenantFunction = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

export default function GenerateSopPage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [functionId, setFunctionId] = useState("");
  const [processAreaId, setProcessAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areas = useMemo(() => {
    return functions.find((fn) => fn.id === functionId)?.areas ?? [];
  }, [functions, functionId]);

  useEffect(() => {
    void apiFetch<{ functions: TenantFunction[] }>("/tenants/profile").then(
      (profile) => setFunctions(profile.functions ?? []),
    );
  }, []);

  async function onGenerate() {
    setError(null);

    if (!functionId || !processAreaId) {
      setError("Select a function and process area first.");
      return;
    }

    if (!description.trim()) {
      setError("Describe the process before generating.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch<{
        draft: Record<string, unknown>;
        gaps: Array<{
          field: string;
          severity: "required" | "recommended";
          message: string;
        }>;
        model: string;
      }>("/sop/generate", {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
          functionId,
          processAreaId,
        }),
      });

      sessionStorage.setItem(
        AI_SOP_REVIEW_STORAGE_KEY,
        JSON.stringify({
          functionId,
          processAreaId,
          description: description.trim(),
          ...result,
        }),
      );

      router.push("/processes/generate/review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PermissionGate permission="processes:create">
      <>
        <PageHeader
          title="Generate with AI"
          description="Describe the process in plain English. The more detail you give, the better the output."
        />

        <div className="rounded-lg border border-border bg-white p-6">
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-950">Function</span>
              <select
                value={functionId}
                onChange={(event) => {
                  setFunctionId(event.target.value);
                  setProcessAreaId("");
                }}
                className="h-10 rounded-md border border-border bg-white px-3"
              >
                <option value="">Select…</option>
                {functions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-950">Process area</span>
              <select
                value={processAreaId}
                onChange={(event) => setProcessAreaId(event.target.value)}
                className="h-10 rounded-md border border-border bg-white px-3"
                disabled={!functionId}
              >
                <option value="">Select…</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm">
            <span className="font-medium text-slate-950">Process description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[220px] rounded-md border border-border px-3 py-2"
              placeholder="Describe the process in plain English. Include who does what, systems involved, approvals, and evidence expectations."
            />
          </label>

          <div className="mt-5 flex justify-end">
            <PrimaryButton>
              <span onClick={loading ? undefined : onGenerate}>
                {loading ? "Generating…" : "Generate SOP"}
              </span>
            </PrimaryButton>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3 rounded-md border border-border bg-surface-bg p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-24 animate-pulse rounded bg-slate-100" />
              <div className="text-sm text-text-muted">
                Aquilens is generating your SOP…
              </div>
            </div>
          ) : null}
        </div>
      </>
    </PermissionGate>
  );
}
