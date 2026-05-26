import { AccessReviewsPanel } from "@/components/auth/access-reviews-panel";
import { PermissionGate } from "@/components/auth/permission-gate";

export default function AccessReviewsPage() {
  return (
    <PermissionGate permission="access_reviews:read">
      <AccessReviewsPanel />
    </PermissionGate>
  );
}
