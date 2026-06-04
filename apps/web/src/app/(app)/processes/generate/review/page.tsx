import { redirect } from "next/navigation";

export default function LegacyGenerateReviewPage() {
  redirect("/processes/compose");
}
