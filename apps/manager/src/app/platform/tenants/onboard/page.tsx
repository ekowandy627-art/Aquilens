"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformShell } from "@/components/platform-shell";
import { TENANT_APP_LOGIN_URL } from "@/lib/constants";

export default function OnboardTenantPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    adminEmail: string;
    temporaryPassword?: string;
    slug: string;
  } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      institutionType: String(form.get("institutionType") ?? "school"),
      country: String(form.get("country") ?? ""),
      adminEmail: String(form.get("adminEmail") ?? ""),
      adminFullName: String(form.get("adminFullName") ?? ""),
    };

    const response = await fetch("/api/platform/tenants/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as {
      error?: string;
      adminEmail?: string;
      temporaryPassword?: string;
      slug?: string;
    } | null;

    if (!response.ok) {
      setError(body?.error ?? "Onboard failed");
      return;
    }

    setCredentials({
      adminEmail: body?.adminEmail ?? payload.adminEmail,
      temporaryPassword: body?.temporaryPassword,
      slug: body?.slug ?? payload.slug,
    });
  }

  return (
    <PlatformShell>
      <div className="max-w-xl space-y-4">
        <h2 className="text-xl font-semibold text-brand-navy">Onboard tenant</h2>
        <p className="text-sm text-text-muted">
          Creates tenant scaffold and super admin in Supabase via the Aquilens API internal route.
        </p>

        {credentials ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="font-medium text-emerald-900">Tenant created</p>
            <p className="mt-2">Admin: {credentials.adminEmail}</p>
            {credentials.temporaryPassword ? (
              <p>Temporary password: {credentials.temporaryPassword}</p>
            ) : null}
            <p className="mt-2">
              Tenant login:{" "}
              <a className="underline" href={`${TENANT_APP_LOGIN_URL}?tenant=${credentials.slug}`}>
                {TENANT_APP_LOGIN_URL}?tenant={credentials.slug}
              </a>
            </p>
            <button
              type="button"
              className="mt-4 text-brand-teal underline"
              onClick={() => router.push("/platform/tenants")}
            >
              Back to tenants
            </button>
          </div>
        ) : (
          <form className="space-y-4 rounded-md border border-border bg-white p-4" onSubmit={onSubmit}>
            <label className="block text-sm">
              Organisation name
              <input name="name" required className="mt-1 w-full rounded-md border border-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Slug
              <input name="slug" required pattern="[a-z0-9-]+" className="mt-1 w-full rounded-md border border-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Institution type
              <select name="institutionType" className="mt-1 w-full rounded-md border border-border px-3 py-2">
                <option value="school">School</option>
                <option value="hospital">Hospital</option>
                <option value="corporate">Corporate</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm">
              Country
              <input name="country" required defaultValue="Ghana" className="mt-1 w-full rounded-md border border-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Admin full name
              <input name="adminFullName" required className="mt-1 w-full rounded-md border border-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Admin email
              <input name="adminEmail" type="email" required className="mt-1 w-full rounded-md border border-border px-3 py-2" />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white">
              Create tenant
            </button>
          </form>
        )}
      </div>
    </PlatformShell>
  );
}
