"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import type { AgentListItem } from "@/lib/agents";

export default function RegisterAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vendor, setVendor] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [riskClassification, setRiskClassification] = useState<"high" | "medium" | "low">(
    "medium",
  );
  const [riskRationale, setRiskRationale] = useState("");
  const [deploymentEnvironment, setDeploymentEnvironment] = useState("production");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const agent = await apiFetch<AgentListItem>("/agents", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          purpose,
          vendor,
          modelName,
          modelVersion,
          riskClassification,
          riskRationale,
          deploymentEnvironment,
        }),
      });
      router.push(`/agents/${agent.agentCode}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to register agent",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Register agent"
        description="Add a governed AI model or tool to the institution registry."
      />

      <form
        onSubmit={(event) => void submit(event)}
        className="space-y-8 rounded-lg border border-border bg-white p-6"
      >
        <section className="grid gap-4 md:grid-cols-2">
          <h2 className="md:col-span-2 text-sm font-semibold text-slate-900">
            Identity
          </h2>
          <Field label="Name" required>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
          <Field label="Purpose">
            <input
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[80px] w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Vendor">
            <input
              value={vendor}
              onChange={(event) => setVendor(event.target.value)}
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
          <Field label="Model name">
            <input
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
          <Field label="Model version">
            <input
              value={modelVersion}
              onChange={(event) => setModelVersion(event.target.value)}
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <h2 className="md:col-span-2 text-sm font-semibold text-slate-900">
            Ownership & deployment
          </h2>
          <Field label="Deployment environment">
            <input
              value={deploymentEnvironment}
              onChange={(event) => setDeploymentEnvironment(event.target.value)}
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <h2 className="md:col-span-2 text-sm font-semibold text-slate-900">Risk</h2>
          <Field label="Risk classification">
            <select
              value={riskClassification}
              onChange={(event) =>
                setRiskClassification(event.target.value as typeof riskClassification)
              }
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field label="Risk rationale" className="md:col-span-2">
            <textarea
              value={riskRationale}
              onChange={(event) => setRiskRationale(event.target.value)}
              className="min-h-[72px] w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Link href="/agents" className="text-sm text-text-muted hover:text-slate-900">
            Cancel
          </Link>
          <PrimaryButton type="submit" disabled={busy || !name.trim()}>
            Register agent
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`grid gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium text-text-muted">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
