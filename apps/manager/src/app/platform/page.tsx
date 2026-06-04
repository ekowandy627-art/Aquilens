import Link from "next/link";
import { PlatformShell } from "@/components/platform-shell";
import { TENANT_APP_LOGIN_URL } from "@/lib/constants";

export default function PlatformDashboardPage() {
  return (
    <PlatformShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Dashboard</h2>
          <p className="mt-1 text-sm text-text-muted">
            Platform operations for Aquilens — tenants and global standards catalog.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/platform/tenants"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">Tenants</h3>
            <p className="mt-1 text-sm text-text-muted">
              Onboard organisations, suspend access, view usage.
            </p>
          </Link>
          <Link
            href="/platform/agents"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">Agents</h3>
            <p className="mt-1 text-sm text-text-muted">
              Platform AI pipelines, prompts, and MTD usage.
            </p>
          </Link>
          <Link
            href="/platform/standards"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">Standards</h3>
            <p className="mt-1 text-sm text-text-muted">
              Global guidance library and publish workflow.
            </p>
          </Link>
          <Link
            href="/platform/ai-usage"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">AI usage</h3>
            <p className="mt-1 text-sm text-text-muted">
              Cross-tenant spend and budget posture.
            </p>
          </Link>
          <Link
            href="/platform/audit"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">Audit</h3>
            <p className="mt-1 text-sm text-text-muted">
              Platform operator actions and support access.
            </p>
          </Link>
          <Link
            href="/platform/benchmarks"
            className="rounded-md border border-border bg-white p-4 hover:border-brand-teal"
          >
            <h3 className="font-medium">Benchmarks</h3>
            <p className="mt-1 text-sm text-text-muted">
              Median AI cost and active-user benchmarks.
            </p>
          </Link>
        </div>

        <p className="text-sm text-text-muted">
          Tenant app login:{" "}
          <a className="text-brand-teal underline" href={TENANT_APP_LOGIN_URL}>
            {TENANT_APP_LOGIN_URL}
          </a>
        </p>
      </div>
    </PlatformShell>
  );
}
