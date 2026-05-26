import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface-bg px-6">
      <section className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-md bg-slate-100 text-slate-600">
          <SearchX className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          The page you are looking for is not part of the Phase 0 shell.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center rounded-md bg-brand-teal px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0b6665]"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
