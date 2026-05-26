import Link from "next/link";
import { LogIn } from "lucide-react";

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
          Authentication is coming in Phase 1. This placeholder keeps the login
          journey visible while the shell is built.
        </p>

        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              placeholder="gis-admin@aquilens.test"
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-slate-950 placeholder:text-slate-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              placeholder="Coming in Phase 1"
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-slate-950 placeholder:text-slate-400"
            />
          </label>
          <Link
            href="/onboarding"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-teal px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0b6665]"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Continue to shell
          </Link>
        </form>
      </section>
    </main>
  );
}
