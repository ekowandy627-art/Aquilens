import { Activity, ClipboardCheck, FileClock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";

const cards = [
  {
    label: "Open workflows",
    value: "0",
    icon: Activity,
  },
  {
    label: "Pending approvals",
    value: "0",
    icon: ClipboardCheck,
  },
  {
    label: "Overdue items",
    value: "0",
    icon: FileClock,
  },
  {
    label: "Agents due",
    value: "0",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Operational Control Room"
        description="Action-first home for processes, approvals, evidence, and governance work that needs attention."
        action={<PrimaryButton>New Process</PrimaryButton>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-md border border-border bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-muted">
                  {card.label}
                </p>
                <Icon className="size-4 text-brand-teal" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-md border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-slate-950">
          No action required yet
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Once processes, workflows, approvals, and attestations exist, this
          screen will lead with the work that needs attention today.
        </p>
      </section>
    </>
  );
}
