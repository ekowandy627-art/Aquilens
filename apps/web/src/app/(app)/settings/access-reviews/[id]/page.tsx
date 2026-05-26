import { AccessReviewDetail } from "@/components/auth/access-review-detail";
import { PermissionGate } from "@/components/auth/permission-gate";

export default async function AccessReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PermissionGate permission="access_reviews:read">
      <AccessReviewDetail reviewId={id} />
    </PermissionGate>
  );
}
