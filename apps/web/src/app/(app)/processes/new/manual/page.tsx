"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { ProcessEditor } from "@/components/processes/process-editor";

export default function ManualProcessPage() {
  return (
    <PermissionGate permission="processes:create">
      <ProcessEditor mode="create" />
    </PermissionGate>
  );
}
