import { Database } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function DataSettingsPage() {
  return (
    <>
      <PageHeader
        title="Your Data"
        description="Data portability, export packs, and documented data models will live here."
      />
      <EmptyState
        icon={Database}
        title="Exports are not wired yet"
        description="The route is in place because visible data portability is part of the product promise."
      />
    </>
  );
}
