"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/use-auth-context";

type PermissionGateProps = {
  permission: string;
  children: React.ReactNode;
};

export function PermissionGate({ permission, children }: PermissionGateProps) {
  const context = useAuthContext();
  const permissions = new Set(context.roles.flatMap((role) => role.permissions));
  const allowed = permissions.has("*") || permissions.has(permission);

  if (context.loading) {
    return (
      <div className="rounded-md border border-border bg-white p-6">
        <div className="h-5 w-48 rounded bg-slate-100" />
        <div className="mt-4 h-32 rounded bg-slate-50" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
        <div className="max-w-md text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-red-50 text-red-600">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
            Access denied
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Your current role does not include `{permission}`.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
