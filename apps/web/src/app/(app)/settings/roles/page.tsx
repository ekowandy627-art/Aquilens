import { PermissionGate } from "@/components/auth/permission-gate";
import { RolesTable } from "@/components/auth/roles-table";

export default function RolesSettingsPage() {
  return (
    <PermissionGate permission="roles:manage">
      <RolesTable />
    </PermissionGate>
  );
}
