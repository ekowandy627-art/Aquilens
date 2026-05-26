"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus } from "lucide-react";
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
      await apiFetch("/auth/invite", {
        method: "POST",
        body: JSON.stringify({ email, fullName, roleId }),
      });
      router.push("/settings/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setLoading(false);
    }
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
