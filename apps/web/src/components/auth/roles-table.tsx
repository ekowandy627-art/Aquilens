"use client";

import { ShieldPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getSessionContext, rolesForTenant } from "@/lib/demo-auth";

export function RolesTable() {
  const context = getSessionContext();
  const roles = rolesForTenant(context.tenant?.id ?? "tenant-gis");

  return (
    <>
      <PageHeader
        title="Roles"
        description="System roles and permission scopes that drive Phase 1 route and API access decisions."
        action={
          <Button type="button">
            <ShieldPlus className="size-4" aria-hidden="true" />
            Create custom role
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <article key={role.id} className="rounded-md border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  {role.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {role.description}
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {role.isSystem ? "System" : "Custom"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-brand-teal"
                >
                  {permission}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
