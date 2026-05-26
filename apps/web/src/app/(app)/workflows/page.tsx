import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        title="Workflows"
        description="Start and track process instances, task completion, approvals, and evidence capture."
        action={<PrimaryButton>Start Workflow</PrimaryButton>}
      />
      <EmptyState
        icon={ListChecks}
        title="No workflows yet"
        description="Workflow instances will appear after an active SOP is started by a process owner."
        actionLabel="Start workflow"
      />
    </>
  );
}
