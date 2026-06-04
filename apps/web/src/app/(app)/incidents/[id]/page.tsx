"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import { getSessionContext } from "@/lib/demo-auth";

type IncidentDetail = {
  id: string;
  incidentCode: string;
  title: string;
  description: string;
  severity: string;
  derivedStatus: string;
  linkedWorkflowInstanceId?: string;
  actions: Array<{
    id: string;
    description: string;
    status: string;
    evidenceNotes?: string;
  }>;
};

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = getSessionContext().roles.map((role) => role.name);
  const isCo = roles.includes("Compliance Officer") || roles.includes("Super Admin");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<IncidentDetail>(`/incidents/${params.id}`);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load incident",
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function openResolution() {
    if (!detail) {
      return;
    }
    await apiFetch(`/incidents/${detail.id}/open-resolution`, { method: "POST" });
    const refreshed = await apiFetch<IncidentDetail>(`/incidents/${detail.id}`);
    setDetail(refreshed);
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!detail) {
    return <p className="text-sm text-muted-foreground">Loading incident…</p>;
  }

  return (
    <>
      <PageHeader
        title={`${detail.incidentCode} — ${detail.title}`}
        description={`Severity: ${detail.severity} · Status: ${detail.derivedStatus}`}
        action={
          detail.linkedWorkflowInstanceId ? (
            <Link href={`/workflows/${detail.linkedWorkflowInstanceId}`}>
              <PrimaryButton>View workflow</PrimaryButton>
            </Link>
          ) : isCo ? (
            <PrimaryButton onClick={() => void openResolution()}>
              Open resolution
            </PrimaryButton>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{detail.description}</p>
      <h2 className="mb-2 text-lg font-semibold">Actions</h2>
      <ul className="space-y-2 text-sm">
        {detail.actions.map((action) => (
          <li key={action.id} className="rounded border border-border px-3 py-2">
            <span className="font-medium">{action.description}</span> — {action.status}
            {action.evidenceNotes ? (
              <p className="mt-1 text-muted-foreground">{action.evidenceNotes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
