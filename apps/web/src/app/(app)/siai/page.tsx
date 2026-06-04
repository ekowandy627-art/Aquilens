"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { apiFetch } from "@/lib/api-client";

type SiaiSummary = {
  id: string;
  siaiCode: string;
  title: string;
  category: string;
  severity: string;
  loggedAt: string;
};

export default function SiaiPage() {
  const [items, setItems] = useState<SiaiSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<SiaiSummary[]>("/siai");
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load SIAI");
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
  }, []);

  return (
    <>
      <PageHeader
        title="SIAI"
        description="Serious incident and integrity alerts with the same resolution workflow as incidents."
        action={
          <Link href="/siai/new">
            <PrimaryButton>Log SIAI</PrimaryButton>
          </Link>
        }
      />
      {loading ? <ListTableSkeleton rows={5} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/siai/${item.id}`} className="font-medium text-primary">
                      {item.siaiCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 capitalize">{item.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
