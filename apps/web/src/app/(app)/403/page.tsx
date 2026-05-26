import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function AccessDeniedPage() {
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
          This area is restricted. Phase 1 will wire this page to tenant roles
          and permissions.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center rounded-md bg-brand-teal px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0b6665]"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
