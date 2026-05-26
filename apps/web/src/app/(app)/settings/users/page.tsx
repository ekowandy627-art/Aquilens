import { PermissionGate } from "@/components/auth/permission-gate";
import { UsersTable } from "@/components/auth/users-table";

export default function UsersSettingsPage() {
  return (
    <PermissionGate permission="users:invite">
      <UsersTable />
    </PermissionGate>
  );
}
