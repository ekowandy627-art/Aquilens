"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, KeyRound, MailPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { rolesForTenant, type DemoRole } from "@/lib/demo-auth";
import { useAuthContext } from "@/lib/use-auth-context";

type ApiRole = {
  id: string;
  name: string;
};

export function InviteUserForm() {
  const router = useRouter();
  const context = useAuthContext();
  const [roles, setRoles] = useState<DemoRole[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ id: string; email: string } | null>(
    null,
  );
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canEditUsers = context.roles.some(
    (role) =>
      role.permissions.includes("*") || role.permissions.includes("users:edit"),
  );

  useEffect(() => {
    async function loadRoles() {
      if (context.source === "supabase") {
        const data = await apiFetch<ApiRole[]>("/roles");
        setRoles(
          data.map((role) => ({
            id: role.id,
            tenantId: context.tenant?.id ?? "",
            name: role.name,
            description: "",
            isSystem: true,
            permissions: [],
          })),
        );
        setRoleId(data[0]?.id ?? "");
        return;
      }

      const fallback = rolesForTenant(context.tenant?.id ?? "tenant-gis");
      setRoles(fallback);
      setRoleId(fallback[0]?.id ?? "");
    }

    void loadRoles().catch((err: Error) => setError(err.message));
  }, [context.source, context.tenant]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ id: string; email: string }>("/auth/invite", {
        method: "POST",
        body: JSON.stringify({ email, fullName, roleId }),
      });
      setCreatedUser(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!createdUser) {
      return;
    }

    setResetError(null);
    setResetLoading(true);
    setCopied(false);

    try {
      const data = await apiFetch<{ resetLink?: string; email: string }>(
        `/users/${createdUser.id}/reset-password`,
        { method: "POST", body: "{}" },
      );
      setResetLink(data.resetLink ?? null);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setResetLoading(false);
    }
  }

  async function copyResetLink() {
    if (!resetLink) {
      return;
    }

    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
  }

  if (createdUser) {
    return (
      <>
        <PageHeader
          title="User invited"
          description="The account is ready. Send a password reset link so they can choose their own password."
        />

        <div className="max-w-2xl rounded-md border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-emerald-950">{createdUser.email}</p>
              <p className="mt-1 text-sm text-emerald-900">
                Profile and role assignment were created successfully.
              </p>
            </div>
          </div>

          {canEditUsers && context.source === "supabase" ? (
            <div className="mt-5 space-y-3">
              <Button
                type="button"
                disabled={resetLoading}
                onClick={() => void sendPasswordReset()}
              >
                <KeyRound className="size-4" aria-hidden="true" />
                {resetLoading ? "Generating link…" : "Send password reset link"}
              </Button>

              {resetLink ? (
                <div className="rounded-md border border-emerald-200 bg-white p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Reset link
                  </p>
                  <p className="mt-2 break-all text-sm text-slate-700">{resetLink}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => void copyResetLink()}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  <p className="mt-2 text-xs text-text-muted">
                    Share this link with the user if email delivery is not configured.
                  </p>
                </div>
              ) : null}

              {resetError ? <p className="text-sm text-red-600">{resetError}</p> : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-900">
              Ask a user administrator to send a password reset link from Settings → Users.
            </p>
          )}

          <Button asChild variant="secondary" className="mt-6">
            <Link href="/settings/users">Back to users</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Invite User"
        description="Create a Supabase Auth account, tenant profile, and initial role assignment."
      />

      <form onSubmit={submit} className="max-w-2xl rounded-md border border-border bg-white p-6">
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-6">
          <MailPlus className="size-4" aria-hidden="true" />
          {loading ? "Inviting..." : "Invite user"}
        </Button>
      </form>
    </>
  );
}
