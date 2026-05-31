"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlatformShell } from "@/components/platform-shell";

type TenantRow = {
  tenantId: string;
  slug: string;
  name: string;
  status: "active" | "suspended";
  institutionType: string;
  country: string;
  userCount?: number;
};

export default function TenantsPage() {
  const [items, setItems] = useState<TenantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/tenants");
      if (!response.ok) {
        throw new Error("Failed to load tenants");
      }
      const body = (await response.json()) as { items: TenantRow[] };
      setItems(body.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleStatus(tenant: TenantRow) {
    const next = tenant.status === "active" ? "suspended" : "active";
    const response = await fetch(`/api/platform/tenants/${tenant.tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      setError("Could not update tenant status");
      return;
    }
    await load();
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-navy">Tenants</h2>
            <p className="text-sm text-text-muted">
              Registry consumed by the tenant app via manager lookup.
            </p>
          </div>
          <Link
            href="/platform/tenants/onboard"
            className="rounded-md bg-brand-teal px-3 py-2 text-sm font-medium text-white"
          >
            Onboard tenant
          </Link>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-text-muted">Loading…</p> : null}

        <div className="overflow-hidden rounded-md border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-bg text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((tenant) => (
                <tr key={tenant.tenantId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tenant.slug}</td>
                  <td className="px-4 py-3">{tenant.institutionType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        tenant.status === "active"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{tenant.userCount ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-brand-teal hover:underline"
                      onClick={() => void toggleStatus(tenant)}
                    >
                      {tenant.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformShell>
  );
}
