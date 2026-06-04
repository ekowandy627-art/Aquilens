"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

export default function NewSiaiPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string }>("/siai", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          category: String(form.get("category") ?? "integrity"),
          severity: String(form.get("severity") ?? "medium"),
        }),
      });
      router.push(`/siai/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log SIAI");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Log SIAI" description="Starts a resolution workflow automatically." />
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
          Category
          <input
            name="category"
            defaultValue="integrity"
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Log SIAI"}
        </PrimaryButton>
      </form>
    </>
  );
}
