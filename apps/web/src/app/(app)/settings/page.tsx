import Link from "next/link";
import { Building2, ClipboardCheck, Database, GitBranch, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const tabs = [
  {
    label: "Organisation",
    description: "Institution name, type, and country.",
    href: "/settings/organisation",
    icon: Building2,
  },
  {
    label: "Structure",
    description: "Create functions, descriptions, and process areas.",
    href: "/settings/structure",
    icon: GitBranch,
  },
  {
    label: "Standards",
    description: "Guidance pack selections and alignment posture.",
    href: "/settings/standards",
    icon: Shield,
  },
  {
    label: "Users",
    description: "Invites, status, and tenant members.",
    href: "/settings/users",
    icon: Users,
  },
  {
    label: "Roles",
    description: "System and custom permission sets.",
    href: "/settings/roles",
    icon: Shield,
  },
  {
    label: "Escalation",
    description: "Notification chains and missed work rules.",
    href: "/settings/escalation",
    icon: Shield,
  },
  {
    label: "Access Reviews",
    description: "Review and confirm user role assignments.",
    href: "/settings/access-reviews",
    icon: ClipboardCheck,
  },
  {
    label: "Your Data",
    description: "Exports and portability controls.",
    href: "/settings/data",
    icon: Database,
  },
  {
    label: "Guest Access",
    description: "External auditor read-only access links.",
    href: "/settings/guest-access",
    icon: Shield,
  },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Tenant configuration, access governance, escalation rules, and data portability controls."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="rounded-md border border-border bg-white p-5 transition-colors hover:border-brand-teal"
              >
                <div className="grid size-10 place-items-center rounded-md bg-teal-50 text-brand-teal">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-slate-950">
                  {tab.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {tab.description}
                </p>
              </Link>
            );
          })}
      </div>
    </>
  );
}
