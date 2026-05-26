import { CreateRoleForm } from "@/components/auth/create-role-form";
import { PermissionGate } from "@/components/auth/permission-gate";

export default function NewRolePage() {
  return (
    <PermissionGate permission="roles:manage">
      <CreateRoleForm />
    </PermissionGate>
  );
}
