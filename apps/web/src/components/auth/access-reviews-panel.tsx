"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type AccessReview = {
  id: string;
  status: string;
  initiated_at: string;
  completed_at: string | null;
  notes: string | null;
};

export function AccessReviewsPanel() {
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch<AccessReview[]>("/access-reviews");
    setReviews(data);
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<AccessReview[]>("/access-reviews")
      .then((data) => {
        if (active) {
          setReviews(data);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function startReview() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/access-reviews", { method: "POST", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Access Reviews"
        description="Periodically confirm that every active user's roles are still appropriate."
        action={
          <Button type="button" onClick={startReview} disabled={loading}>
            <Plus className="size-4" aria-hidden="true" />
            Start review
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Review</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Started</th>
              <th className="px-4 py-3 font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-slate-950">
                  <Link href={`/settings/access-reviews/${review.id}`}>
                    <ClipboardCheck className="mr-2 inline size-4 text-brand-teal" />
                    {review.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                    {review.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(review.initiated_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {review.completed_at
                    ? new Date(review.completed_at).toLocaleString()
                    : "Open"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
