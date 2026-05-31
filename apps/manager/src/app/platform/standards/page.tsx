"use client";

import { useEffect, useState } from "react";
import { PlatformShell } from "@/components/platform-shell";

type PackRow = {
  id: string;
  slug: string;
  name: string;
  packType: string;
  versionLabel: string;
  isActive: boolean;
};

export default function StandardsPage() {
  const [items, setItems] = useState<PackRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/platform/standards");
    if (!response.ok) {
      setError("Failed to load standards packs");
      return;
    }
    const body = (await response.json()) as { items: PackRow[] };
    setItems(body.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(pack: PackRow) {
    const response = await fetch(`/api/platform/standards/${pack.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pack.isActive }),
    });
    if (!response.ok) {
      setError("Could not update pack");
      return;
    }
    await load();
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Standards packs</h2>
          <p className="text-sm text-text-muted">
            Global guidance library visible to all tenants (active packs + any already selected).
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="overflow-hidden rounded-md border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-bg text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((pack) => (
                <tr key={pack.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{pack.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{pack.slug}</td>
                  <td className="px-4 py-3">{pack.packType}</td>
                  <td className="px-4 py-3">{pack.versionLabel}</td>
                  <td className="px-4 py-3">
                    {pack.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-brand-teal hover:underline"
                      onClick={() => void toggleActive(pack)}
                    >
                      {pack.isActive ? "Deactivate" : "Activate"}
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
