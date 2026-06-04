import { redirect } from "next/navigation";

export default function LegacyStartWorkflowPage() {
  redirect("/workflows");
}
