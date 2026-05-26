import { Shield } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function RolesSettingsPage() {
  return (
    <>
      <PageHeader
        title="Roles"
        description="System roles and custom permission sets will be enforced by the API permission guard."
      />
      <EmptyState
        icon={Shield}
        title="Role management comes with Phase 1"
        description="The UI route exists now so settings navigation stays complete while RBAC is implemented."
      />
    </>
  );
}
