"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type Permission = {
  id: string;
  resource: string;
  action: string;
  description: string | null;
};

export function CreateRoleForm() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<Permission[]>("/permissions")
      .then(setPermissions)
      .catch((err: Error) => setError(err.message));
  }, []);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/roles", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          permissionIds: [...selected],
        }),
      });
      router.push("/settings/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create Role"
        description="Create a tenant-specific role from the Phase 1 permission set."
      />

      <form onSubmit={submit} className="rounded-md border border-border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Role name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {permissions.map((permission) => (
            <label
              key={permission.id}
              className="flex gap-3 rounded-md border border-border p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(permission.id)}
                onChange={() => toggle(permission.id)}
              />
              <span>
                <span className="font-medium text-slate-950">
                  {permission.resource}:{permission.action}
                </span>
                <span className="block text-xs text-text-muted">
                  {permission.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-6">
          <ShieldPlus className="size-4" aria-hidden="true" />
          {loading ? "Creating..." : "Create role"}
        </Button>
      </form>
    </>
  );
}
