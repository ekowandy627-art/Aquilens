import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function UsersSettingsPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="User invitations and tenant membership will be wired in the security kernel."
      />
      <EmptyState
        icon={Users}
        title="User management comes with Phase 1"
        description="This placeholder is ready for Supabase Auth, tenant membership, roles, and invited user status."
      />
    </>
  );
}
