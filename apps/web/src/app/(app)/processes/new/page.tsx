"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

type TenantFunction = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

export default function NewProcessPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [loadingScaffold, setLoadingScaffold] = useState(true);

  const [functionId, setFunctionId] = useState("");
  const [processAreaId, setProcessAreaId] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");

  const areas = useMemo(() => {
    const fn = functions.find((f) => f.id === functionId);
    return fn?.areas ?? [];
  }, [functions, functionId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<{ functions: TenantFunction[] }>(
          "/tenants/profile",
        );
        if (!cancelled) {
          setFunctions(profile.functions ?? []);
        }
      } finally {
        if (!cancelled) setLoadingScaffold(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate() {
    setError(null);

    if (!functionId || !processAreaId || !name.trim()) {
      setError("Select a function and process area, and enter a process name.");
      return;
    }

    setSaving(true);
    try {
      const created = await apiFetch<{ id: string }>("/processes", {
        method: "POST",
        body: JSON.stringify({
          functionId,
          processAreaId,
          name: name.trim(),
          purpose: purpose.trim() ? purpose.trim() : undefined,
        }),
      });
      router.push(`/processes/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create process.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New Process"
        description="Create a new SOP draft. You can add steps and governance details after creation."
        action={
          <PrimaryButton>
            <span onClick={saving ? undefined : onCreate}>
              {saving ? "Creating…" : "Create"}
            </span>
          </PrimaryButton>
        }
      />

      <div className="rounded-lg border border-border bg-white p-6">
        {loadingScaffold ? (
          <div className="text-sm text-text-muted">Loading function tree…</div>
        ) : functions.length === 0 ? (
          <div className="text-sm text-text-muted">
            No function tree found. Complete onboarding first.
          </div>
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-950">
                Function
              </label>
              <select
                value={functionId}
                onChange={(e) => {
                  setFunctionId(e.target.value);
                  setProcessAreaId("");
                }}
                className="h-10 rounded-md border border-border bg-white px-3 text-sm"
              >
                <option value="">Select…</option>
                {functions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-950">
                Process area
              </label>
              <select
                value={processAreaId}
                onChange={(e) => setProcessAreaId(e.target.value)}
                className="h-10 rounded-md border border-border bg-white px-3 text-sm"
                disabled={!functionId}
              >
                <option value="">
                  {functionId ? "Select…" : "Select a function first"}
                </option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-950">Title</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-md border border-border px-3 text-sm"
                placeholder='e.g. "Enrol New Student"'
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-950">
                Purpose (optional)
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="min-h-[96px] rounded-md border border-border px-3 py-2 text-sm"
                placeholder="Why does this process exist?"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saving ? undefined : onCreate}
                className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Creating…" : "Create process"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

