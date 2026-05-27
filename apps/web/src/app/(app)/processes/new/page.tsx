"use client";

import Link from "next/link";
import { FileUp, Mic, PenLine, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const methods = [
  {
    href: "/processes/new/manual",
    title: "Build manually",
    description: "Use the step-by-step wizard to define every field yourself.",
    icon: PenLine,
    enabled: true,
  },
  {
    href: "/processes/generate",
    title: "Generate with AI",
    description: "Describe the process in plain English and review a structured draft.",
    icon: Sparkles,
    enabled: true,
  },
  {
    href: "#",
    title: "Upload a file",
    description: "Import an existing SOP document.",
    icon: FileUp,
    enabled: false,
    badge: "Coming soon",
  },
  {
    href: "#",
    title: "Speak or record",
    description: "Dictate or record a process walkthrough.",
    icon: Mic,
    enabled: false,
    badge: "Coming soon",
  },
] as const;

export default function NewProcessMethodPage() {
  return (
    <>
      <PageHeader
        title="New Process"
        description="Choose how you want to create this SOP draft."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const content = (
            <div
              className={`rounded-lg border border-border bg-white p-5 ${
                method.enabled
                  ? "hover:border-brand-teal hover:bg-surface-bg"
                  : "opacity-70"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="grid size-10 place-items-center rounded-md bg-brand-teal/10 text-brand-teal">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-slate-950">{method.title}</h2>
                    {"badge" in method && method.badge ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-text-muted">
                        {method.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{method.description}</p>
                </div>
              </div>
            </div>
          );

          return method.enabled ? (
            <Link key={method.title} href={method.href}>
              {content}
            </Link>
          ) : (
            <div key={method.title}>{content}</div>
          );
        })}
      </div>
    </>
  );
}
