"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DetailPageSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import {
  attestationBadgeClass,
  type AgentDetail,
  riskBadgeClass,
} from "@/lib/agents";
import { getSessionContext } from "@/lib/demo-auth";

const tabs = [
  "Overview",
  "Linked Processes",
  "Attestation History",
] as const;

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AgentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [outcome, setOutcome] = useState<"confirmed" | "flagged" | "deprecation_recommended">(
    "confirmed",
  );
  const [notes, setNotes] = useState("");
  const [deprecateImpact, setDeprecateImpact] = useState<string | null>(null);

  const permissions = getSessionContext().roles.flatMap((role) => role.permissions);
  const canEdit =
    permissions.includes("*") || permissions.includes("agents:edit");

  async function reload() {
    const detail = await apiFetch<AgentDetail>(`/agents/${params.id}`);
    setData(detail);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await apiFetch<AgentDetail>(`/agents/${params.id}`);
        if (!cancelled) {
          setData(detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load agent",
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

  async function submitAttestation() {
    if (!data) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/agents/${data.id}/attest`, {
        method: "POST",
        body: JSON.stringify({ outcome, notes }),
      });
      setShowAttestModal(false);
      setNotes("");
      await reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Attestation failed",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deprecateAgent() {
    if (!data) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{
        agent: AgentDetail;
        impact: { linkedProcessCount: number };
      }>(`/agents/${data.id}/deprecate`, { method: "POST" });
      setDeprecateImpact(
        `This agent is linked to ${result.impact.linkedProcessCount} active process${
          result.impact.linkedProcessCount === 1 ? "" : "es"
        }.`,
      );
      await reload();
    } catch (deprecateError) {
      setError(
        deprecateError instanceof Error ? deprecateError.message : "Deprecation failed",
      );
    } finally {
      setBusy(false);
    }
  }

  const showAttestCta =
    data?.attestationStatus === "overdue" || data?.attestationStatus === "due";

  return (
    <>
      <PageHeader
        title={data?.name ?? "Agent"}
        description={data?.agentCode ?? "AI agent registry"}
        action={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              {showAttestCta ? (
                <PrimaryButton onClick={() => setShowAttestModal(true)}>
                  Attest Now
                </PrimaryButton>
              ) : null}
              {data?.status === "active" ? (
                <PrimaryButton onClick={() => void deprecateAgent()} disabled={busy}>
                  Deprecate Agent
                </PrimaryButton>
              ) : null}
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <DetailPageSkeleton />
      ) : error && !data ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : data ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-700">
              {data.status}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${riskBadgeClass(data.riskClassification)}`}
            >
              {data.riskClassification} risk
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${attestationBadgeClass(data.attestationStatus)}`}
            >
              {data.attestationStatus === "overdue" ? "Overdue" : data.attestationStatus}
            </span>
          </div>

          {deprecateImpact ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {deprecateImpact}
            </div>
          ) : null}

          <div className="mb-4 flex gap-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm ${
                  activeTab === tab
                    ? "border-slate-900 font-medium text-slate-900"
                    : "border-transparent text-text-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-white p-6">
            {activeTab === "Overview" ? (
              <dl className="grid gap-4 md:grid-cols-2">
                <Field label="Vendor" value={data.vendor} />
                <Field label="Model" value={[data.modelName, data.modelVersion].filter(Boolean).join(" ")} />
                <Field label="Function" value={data.owningFunctionName} />
                <Field label="Purpose" value={data.purpose} />
                <Field label="Description" value={data.description} />
                <Field label="Risk rationale" value={data.riskRationale} />
                <Field
                  label="Last attested"
                  value={
                    data.lastAttestedAt
                      ? new Date(data.lastAttestedAt).toLocaleString()
                      : undefined
                  }
                />
                <Field
                  label="Next attestation due"
                  value={
                    data.nextAttestationDue
                      ? new Date(data.nextAttestationDue).toLocaleDateString()
                      : undefined
                  }
                />
              </dl>
            ) : null}

            {activeTab === "Linked Processes" ? (
              <ul className="space-y-3 text-sm">
                {data.linkedProcesses.length === 0 ? (
                  <li className="text-text-muted">No linked processes.</li>
                ) : (
                  data.linkedProcesses.map((process) => (
                    <li key={process.processStepId}>
                      <Link
                        href={`/processes/${process.processId}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {process.processName}
                      </Link>
                      {process.processCode ? (
                        <span className="ml-2 text-xs text-text-muted">
                          {process.processCode}
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            ) : null}

            {activeTab === "Attestation History" ? (
              <ul className="space-y-4 text-sm">
                {data.attestations.map((item) => (
                  <li key={item.id} className="border-b border-border pb-3 last:border-0">
                    <p className="font-medium capitalize">{item.outcome.replace("_", " ")}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(item.attestedAt).toLocaleString()}
                    </p>
                    {item.notes ? <p className="mt-1 text-slate-800">{item.notes}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}

      {showAttestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">Attest agent</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-text-muted">Outcome</span>
                <select
                  value={outcome}
                  onChange={(event) =>
                    setOutcome(
                      event.target.value as typeof outcome,
                    )
                  }
                  className="h-10 rounded-md border border-border px-3"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="flagged">Flagged</option>
                  <option value="deprecation_recommended">
                    Deprecation recommended
                  </option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-text-muted">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[96px] rounded-md border border-border px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => setShowAttestModal(false)}
              >
                Cancel
              </button>
              <PrimaryButton disabled={busy} onClick={() => void submitAttestation()}>
                Submit attestation
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}
