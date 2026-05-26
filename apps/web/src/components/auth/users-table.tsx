"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MailPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { rolesForTenant, usersForTenant, type DemoRole, type DemoUser } from "@/lib/demo-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/use-auth-context";

type DbUserRole = {
  user_id: string;
  role_id: string;
};

type DirectoryState = {
  users: DemoUser[];
  roles: DemoRole[];
  userRoles: DbUserRole[];
};

export function UsersTable() {
  const context = useAuthContext();
  const [directory, setDirectory] = useState<DirectoryState | null>(null);
  const fallbackUsers = usersForTenant(context.tenant?.id ?? "tenant-gis");
  const fallbackRoles = rolesForTenant(context.tenant?.id ?? "tenant-gis");

  useEffect(() => {
    let mounted = true;

    async function loadDirectory() {
      if (context.source !== "supabase" || !context.tenant) {
        setDirectory(null);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const [{ data: users }, { data: roles }, { data: userRoles }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, tenant_id, full_name, email, status, last_login_at")
            .order("full_name"),
          supabase
            .from("roles")
            .select("id, tenant_id, name, description, is_system")
            .eq("tenant_id", context.tenant.id)
            .order("name"),
          supabase.from("user_roles").select("user_id, role_id"),
        ]);

      if (mounted) {
        setDirectory({
          users: (users ?? []).map((user) => ({
            id: user.id,
            tenantId: user.tenant_id,
            fullName: user.full_name,
            email: user.email,
            status: user.status,
            lastLoginAt: user.last_login_at ?? undefined,
            roles: (userRoles ?? [])
              .filter((role) => role.user_id === user.id)
              .map((role) => role.role_id),
          })),
          roles: (roles ?? []).map((role) => ({
            id: role.id,
            tenantId: role.tenant_id,
            name: role.name,
            description: role.description ?? "",
            isSystem: role.is_system,
            permissions: [],
          })),
          userRoles: userRoles ?? [],
        });
      }
    }

    void loadDirectory();

    return () => {
      mounted = false;
    };
  }, [context.source, context.tenant]);

  const users = directory?.users ?? fallbackUsers;
  const roles = directory?.roles ?? fallbackRoles;
  const roleNamesByUser = useMemo(() => {
    return new Map(
      users.map((user) => [
        user.id,
        user.roles
          .map((roleId) => roles.find((role) => role.id === roleId)?.name)
          .filter(Boolean)
          .join(", "),
      ]),
    );
  }, [roles, users]);

  return (
    <>
      <PageHeader
        title="Users"
        description={
          context.source === "supabase"
            ? "Live Supabase tenant users with role assignments and status."
            : "Tenant-scoped demo user list with role assignments and status."
        }
        action={
          <Button asChild>
            <Link href="/settings/users/invite">
              <MailPlus className="size-4" aria-hidden="true" />
              Invite user
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-slate-950">
                  {user.fullName}
                </td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3 text-slate-600">{roleNamesByUser.get(user.id)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium capitalize text-green-700">
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
