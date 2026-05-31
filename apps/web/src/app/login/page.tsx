import { LoginForm } from "@/components/auth/login-form";
import {
  lookupTenantFromManager,
  resolveTenantSlug,
} from "@/lib/manager/tenant-lookup";

type LoginPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const slug = resolveTenantSlug(params.tenant);
  const tenant = await lookupTenantFromManager(slug);

  const title = tenant?.name ? `Sign in to ${tenant.name}` : "Sign in to Aquilens";
  const suspended = tenant?.status === "suspended";

  return (
    <main className="grid min-h-screen place-items-center bg-surface-bg px-6">
      <section className="w-full max-w-sm rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="grid size-11 place-items-center rounded-md bg-brand-navy text-sm font-semibold text-white">
          A
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          {tenant
            ? `${tenant.institutionType} · ${tenant.country}`
            : "Sign in with your organisation account."}
        </p>

        {suspended ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This organisation is suspended. Contact Aquilens support.
          </p>
        ) : (
          <LoginForm tenantSlug={slug} tenantSuspended={false} />
        )}
      </section>
    </main>
  );
}
