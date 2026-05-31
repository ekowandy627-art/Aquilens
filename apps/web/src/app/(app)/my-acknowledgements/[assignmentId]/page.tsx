"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAssignmentSop } from "@/lib/acknowledgements";

export default function AcknowledgementReadPage() {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function redirectToTutorial() {
      try {
        const sop = await fetchAssignmentSop(params.assignmentId);
        if (!cancelled) {
          router.replace(
            `/processes/${sop.processId}/tutorial?acknowledge=${params.assignmentId}`,
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load assignment",
          );
        }
      }
    }
    void redirectToTutorial();
    return () => {
      cancelled = true;
    };
  }, [params.assignmentId, router]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return <p className="text-sm text-text-muted">Opening procedure tutorial…</p>;
}
