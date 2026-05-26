"use client";

import { useEffect, useState } from "react";
import { ShieldPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { rolesForTenant, type DemoRole } from "@/lib/demo-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/use-auth-context";

export function RolesTable() {
  const context = useAuthContext();
  const [liveRoles, setLiveRoles] = useState<DemoRole[] | null>(null);
  const fallbackRoles = rolesForTenant(context.tenant?.id ?? "tenant-gis");

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      if (context.source !== "supabase" || !context.tenant) {
        setLiveRoles(null);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("roles")
        .select("id, tenant_id, name, description, is_system")
        .eq("tenant_id", context.tenant.id)
        .order("name");

      if (mounted) {
        setLiveRoles(
          (data ?? []).map((role) => ({
            id: role.id,
            tenantId: role.tenant_id,
            name: role.name,
            description: role.description ?? "",
            isSystem: role.is_system,
            permissions: [],
          })),
        );
      }
    }

    void loadRoles();

    return () => {
      mounted = false;
    };
  }, [context.source, context.tenant]);

  const roles = liveRoles ?? fallbackRoles;

  return (
    <>
      <PageHeader
        title="Roles"
        description={
          context.source === "supabase"
            ? "Live Supabase system roles for the current tenant."
            : "System roles and permission scopes that drive Phase 1 access decisions."
        }
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
