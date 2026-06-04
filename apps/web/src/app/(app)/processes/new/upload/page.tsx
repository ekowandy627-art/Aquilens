import { redirect } from "next/navigation";

export default function LegacyUploadPage() {
  redirect("/processes/compose");
}
