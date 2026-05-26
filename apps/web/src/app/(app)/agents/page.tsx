import { Bot } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";

export default function AgentsPage() {
  return (
    <>
      <PageHeader
        title="AI Agent Registry"
        description="Register models, owners, data inputs, tools, risk ratings, attestations, and linked process steps."
        action={<PrimaryButton>Register Agent</PrimaryButton>}
      />
      <EmptyState
        icon={Bot}
        title="No agents registered yet"
        description="AI models and agents used by the institution will be governed here before they are linked to SOP steps."
        actionLabel="Register agent"
      />
    </>
  );
}
