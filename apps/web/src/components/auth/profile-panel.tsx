"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useAuthContext } from "@/lib/use-auth-context";

export function ProfilePanel() {
  const context = useAuthContext();

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Current identity, tenant membership, roles, and MFA state."
      />

      <section className="rounded-md border border-border bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-700">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {context.user?.fullName ?? "Not signed in"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {context.loading
                ? "Loading profile..."
                : (context.user?.email ?? "Sign in to view profile details.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {context.roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-brand-teal"
                >
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted">
              Tenant
            </p>
            <p className="mt-1 text-sm font-medium text-slate-950">
              {context.tenant?.name ?? "None"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted">
              Status
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-950">
              {context.user?.status ?? "unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted">
              Source
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-950">
              {context.source}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted">
              MFA
            </p>
            <p className="mt-1 text-sm font-medium text-slate-950">
              Available in Supabase Auth
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
