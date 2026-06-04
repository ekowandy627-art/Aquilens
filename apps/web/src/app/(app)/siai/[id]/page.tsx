"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

type SiaiDetail = {
  id: string;
  siaiCode: string;
  title: string;
  description: string;
  severity: string;
  derivedStatus: string;
  linkedWorkflowInstanceId?: string;
};

export default function SiaiDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SiaiDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<SiaiDetail>(`/siai/${params.id}`);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load SIAI");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!detail) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={`${detail.siaiCode} — ${detail.title}`}
        description={`${detail.severity} · ${detail.derivedStatus}`}
        action={
          detail.linkedWorkflowInstanceId ? (
            <Link href={`/workflows/${detail.linkedWorkflowInstanceId}`}>
              <PrimaryButton>View workflow</PrimaryButton>
            </Link>
          ) : null
        }
      />
      <p className="max-w-2xl text-sm text-muted-foreground">{detail.description}</p>
    </>
  );
}
