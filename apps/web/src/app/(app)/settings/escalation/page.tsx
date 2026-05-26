import { Shield } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function EscalationSettingsPage() {
  return (
    <>
      <PageHeader
        title="Escalation"
        description="Escalation rules will notify the right roles when work is overdue."
      />
      <EmptyState
        icon={Shield}
        title="Escalation rules come later"
        description="This placeholder keeps the settings surface ready for workflow and notification phases."
      />
    </>
  );
}
