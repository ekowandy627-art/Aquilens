import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";

export default function ProcessesPage() {
  return (
    <>
      <PageHeader
        title="Processes"
        description="Document, govern, review, and version each institutional process from one repository."
        action={<PrimaryButton>New Process</PrimaryButton>}
      />
      <EmptyState
        icon={ClipboardList}
        title="No processes yet"
        description="Processes will appear here once a function tree exists and owners begin creating SOP drafts."
        actionLabel="Create process"
      />
    </>
  );
}
