import { PermissionGate } from "@/components/auth/permission-gate";
import { StructureEditor } from "@/components/structure-editor";

export default function StructureSettingsPage() {
  return (
    <PermissionGate permission="tenant_scaffold:manage">
      <StructureEditor />
    </PermissionGate>
  );
}
