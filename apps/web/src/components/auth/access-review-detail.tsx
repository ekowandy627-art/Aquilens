"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type ReviewItem = {
  id: string;
  user_id: string;
  decision: "confirmed" | "revoked" | null;
  notes: string | null;
  users: {
    email: string;
    full_name: string;
    status: string;
  } | null;
};

type ReviewDetail = {
  id: string;
  status: string;
  initiated_at: string;
  completed_at: string | null;
  access_review_items: ReviewItem[];
};

export function AccessReviewDetail({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setReview(await apiFetch<ReviewDetail>(`/access-reviews/${reviewId}`));
  }, [reviewId]);

  useEffect(() => {
    let active = true;

    apiFetch<ReviewDetail>(`/access-reviews/${reviewId}`)
      .then((data) => {
        if (active) {
          setReview(data);
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
  }, [reviewId]);

  async function decide(itemId: string, decision: "confirmed" | "revoked") {
    await apiFetch(`/access-reviews/${reviewId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ decision }),
    });
    await load();
  }

  async function complete() {
    await apiFetch(`/access-reviews/${reviewId}/complete`, {
      method: "POST",
      body: "{}",
    });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Access Review"
        description="Confirm or revoke each user's current access."
        action={
          <Button type="button" onClick={complete} disabled={review?.status === "completed"}>
            Complete review
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Decision</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(review?.access_review_items ?? []).map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-950">
                    {item.users?.full_name}
                  </p>
                  <p className="text-slate-600">{item.users?.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">
                  {item.users?.status}
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">
                  {item.decision ?? "Pending"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void decide(item.id, "confirmed")}
                    >
                      <Check className="size-4" />
                      Confirm
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void decide(item.id, "revoked")}
                    >
                      <X className="size-4" />
                      Revoke
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
