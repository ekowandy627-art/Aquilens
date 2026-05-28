"use client";

import { useEffect, useState } from "react";
import {
  acknowledgementStatusBadgeClass,
  fetchProcessAcknowledgements,
  type ProcessAcknowledgements,
} from "@/lib/acknowledgements";

type Props = {
  processId: string;
};

export function ProcessAcknowledgementsPanel({ processId }: Props) {
  const [data, setData] = useState<ProcessAcknowledgements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetchProcessAcknowledgements(processId);
        if (!cancelled) {
          setData(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load acknowledgements",
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
  }, [processId]);

  if (loading) {
    return (
      <p className="text-sm text-text-muted">Loading acknowledgement progress…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data?.campaigns.length) {
    return (
      <p className="text-sm text-text-muted">
        No acknowledgement campaigns yet. Publish with acknowledgement required or
        create a campaign manually.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {data.campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="rounded-lg border border-border bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              Version campaign · {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-text-muted">
              {campaign.completionPercent}% complete
            </p>
          </div>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {campaign.assignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-slate-800">
                    {assignment.userName ?? assignment.userId}
                    {assignment.userEmail ? (
                      <span className="block text-xs text-text-muted">
                        {assignment.userEmail}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${acknowledgementStatusBadgeClass(assignment.status)}`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="py-2 text-text-muted">
                    {assignment.acknowledgedAt
                      ? new Date(assignment.acknowledgedAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
