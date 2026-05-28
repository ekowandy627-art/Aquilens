"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetchPublic } from "@/lib/api-client";
import type { AuditEvent } from "@/lib/audit";

type GuestGrant = {
  scope: string;
  scopeId?: string;
  scopeLabel?: string;
  auditorEmail: string;
  expiresAt: string;
  status: string;
};

export default function GuestAccessViewPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [grant, setGrant] = useState<GuestGrant | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const accessToken = token;
    let cancelled = false;
    async function load() {
      try {
        const [grantData, auditData] = await Promise.all([
          apiFetchPublic<GuestGrant>(
            `/guest-access/validate/${encodeURIComponent(accessToken)}`,
          ),
          apiFetchPublic<{ items: AuditEvent[] }>(
            `/guest-access/audit/${encodeURIComponent(accessToken)}`,
          ),
        ]);
        if (!cancelled) {
          setGrant(grantData);
          setEvents(auditData.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Access denied",
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
  }, [token]);

  if (!token) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Missing access token.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
        Validating guest access…
      </div>
    );
  }

  if (error || !grant) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Access denied"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-5">
        <h1 className="text-xl font-semibold">External Auditor View</h1>
        <p className="mt-2 text-sm text-text-muted">
          Read-only scoped access for {grant.auditorEmail} —{" "}
          {grant.scopeLabel ?? grant.scopeId}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-muted">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">{item.actorName ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.eventType}</td>
                <td className="px-4 py-3">{item.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
