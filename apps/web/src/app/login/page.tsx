import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface-bg px-6">
      <section className="w-full max-w-sm rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="grid size-11 place-items-center rounded-md bg-brand-navy text-sm font-semibold text-white">
          A
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          Sign in to Aquilens
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Sign in with a seeded Phase 1 demo account. Supabase password auth is
          used automatically when project env vars are configured.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
