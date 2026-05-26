import { InviteUserForm } from "@/components/auth/invite-user-form";
import { PermissionGate } from "@/components/auth/permission-gate";

export default function InviteUserPage() {
  return (
    <PermissionGate permission="users:invite">
      <InviteUserForm />
    </PermissionGate>
  );
}
