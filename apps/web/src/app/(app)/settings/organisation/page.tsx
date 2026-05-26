import { PermissionGate } from "@/components/auth/permission-gate";
import { OrganisationSettings } from "@/components/organisation-settings";

export default function OrganisationSettingsPage() {
  return (
    <PermissionGate permission="settings:edit">
      <OrganisationSettings />
    </PermissionGate>
  );
}
