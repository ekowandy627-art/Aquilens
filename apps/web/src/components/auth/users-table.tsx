"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, MailPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { rolesForTenant, usersForTenant, type DemoRole, type DemoUser } from "@/lib/demo-auth";
import { apiFetch } from "@/lib/api-client";
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
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetLinkByUserId, setResetLinkByUserId] = useState<Record<string, string>>({});
  const [resetError, setResetError] = useState<string | null>(null);
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
  const canEditUsers = context.roles.some(
    (role) =>
      role.permissions.includes("*") || role.permissions.includes("users:edit"),
  );

  async function sendPasswordReset(userId: string) {
    setResetError(null);
    setResettingUserId(userId);

    try {
      const data = await apiFetch<{ resetLink?: string }>(
        `/users/${userId}/reset-password`,
        { method: "POST", body: "{}" },
      );

      if (data.resetLink) {
        setResetLinkByUserId((current) => ({
          ...current,
          [userId]: data.resetLink!,
        }));
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setResettingUserId(null);
    }
  }

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

      {resetError ? <p className="mb-4 text-sm text-red-600">{resetError}</p> : null}

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              {canEditUsers && context.source === "supabase" ? (
                <th className="px-4 py-3 font-semibold">Actions</th>
              ) : null}
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
                {canEditUsers && context.source === "supabase" ? (
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-2.5 text-xs"
                        disabled={resettingUserId === user.id || user.status === "deactivated"}
                        onClick={() => void sendPasswordReset(user.id)}
                      >
                        <KeyRound className="size-3.5" aria-hidden="true" />
                        {resettingUserId === user.id ? "Sending…" : "Reset password"}
                      </Button>
                      {resetLinkByUserId[user.id] ? (
                        <div className="max-w-xs space-y-1">
                          <p className="break-all text-xs text-text-muted">
                            {resetLinkByUserId[user.id]}
                          </p>
                          <button
                            type="button"
                            className="text-xs font-medium text-brand-teal hover:underline"
                            onClick={() =>
                              void navigator.clipboard.writeText(resetLinkByUserId[user.id]!)
                            }
                          >
                            Copy link
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
