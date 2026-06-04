"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

export default function NewIncidentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string }>("/incidents", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          incidentType: String(form.get("incidentType") ?? "operational"),
          severity: String(form.get("severity") ?? "medium"),
          correctiveAction: String(form.get("correctiveAction") ?? "") || undefined,
        }),
      });
      router.push(`/incidents/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log incident");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Log incident"
        description="Creates a resolution workflow with corrective action and senior sign-off."
      />
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <label className="block text-sm">
          Title
          <input name="title" required className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Type
          <input
            name="incidentType"
            defaultValue="operational"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Severity
          <select name="severity" className="mt-1 w-full rounded border px-3 py-2">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm">
          Corrective action (optional)
          <textarea
            name="correctiveAction"
            rows={2}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Log incident"}
        </PrimaryButton>
      </form>
    </>
  );
}
