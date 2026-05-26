"use client";

import { MailPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getSessionContext, rolesForTenant, usersForTenant } from "@/lib/demo-auth";

export function UsersTable() {
  const context = getSessionContext();
  const users = usersForTenant(context.tenant?.id ?? "tenant-gis");
  const roles = rolesForTenant(context.tenant?.id ?? "tenant-gis");

  return (
    <>
      <PageHeader
        title="Users"
        description="Tenant-scoped user list with role assignments and status. Supabase invite delivery is next."
        action={
          <Button type="button">
            <MailPlus className="size-4" aria-hidden="true" />
            Invite user
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
                <td className="px-4 py-3 text-slate-600">
                  {user.roles
                    .map((roleId) => roles.find((role) => role.id === roleId)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </td>
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
