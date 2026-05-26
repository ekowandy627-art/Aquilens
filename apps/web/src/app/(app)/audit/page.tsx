import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit"
        description="Immutable event history and export-ready evidence trails across the tenant."
        action={<PrimaryButton>Export CSV</PrimaryButton>}
      />
      <EmptyState
        icon={ScrollText}
        title="No audit events yet"
        description="Audit entries will be written automatically when users create processes, submit approvals, complete tasks, and upload evidence."
      />
    </>
  );
}
