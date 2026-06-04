"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProcessTutorial } from "@/components/processes/process-tutorial";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api-client";
import type { ProcessDetail } from "@/lib/processes";

export default function ProcessTutorialPage() {
  const params = useParams<{ id: string }>();
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
        if (!cancelled) {
          setProcess(detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load tutorial",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-text-muted">Loading tutorial…</p>;
  }

  if (error && !process) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const steps = process?.steps ?? [];
  const processName = process?.name ?? "Procedure";
  const versionLabel = process?.currentVersion?.versionNumber
    ? String(process.currentVersion.versionNumber)
    : undefined;
  const effectiveDate = process?.currentVersion?.effectiveDate;
  const purpose = process?.purpose;

  return (
    <>
      <PageHeader
        title="Procedure tutorial"
        description="Step-by-step reference generated from the published SOP."
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href={`/processes/${params.id}`} className="text-brand-teal hover:underline">
          ← Back to process
        </Link>
      </div>

      <ProcessTutorial
        processName={processName}
        versionLabel={versionLabel}
        effectiveDate={effectiveDate}
        purpose={purpose}
        steps={steps}
      />
    </>
  );
}
