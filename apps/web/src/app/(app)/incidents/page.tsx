"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { apiFetch } from "@/lib/api-client";

type IncidentSummary = {
  id: string;
  incidentCode: string;
  title: string;
  severity: string;
  derivedStatus: string;
  loggedAt: string;
};

export default function IncidentsPage() {
  const [items, setItems] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<IncidentSummary[]>("/incidents");
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load incidents",
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
  }, []);

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Log incidents and track resolution workflows with evidence and senior sign-off."
        action={
          <Link href="/incidents/new">
            <PrimaryButton>Log incident</PrimaryButton>
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
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Logged</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/incidents/${item.id}`} className="font-medium text-primary">
                      {item.incidentCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 capitalize">{item.severity}</td>
                  <td className="px-4 py-3">{item.derivedStatus}</td>
                  <td className="px-4 py-3">
                    {new Date(item.loggedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">No incidents logged yet.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
