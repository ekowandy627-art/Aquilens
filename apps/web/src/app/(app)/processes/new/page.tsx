import { redirect } from "next/navigation";

export default function LegacyNewProcessPage() {
  redirect("/processes/compose");
}
