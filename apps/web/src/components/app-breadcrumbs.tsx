"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  resolveBreadcrumbs,
  shouldShowBreadcrumbs,
} from "@/lib/breadcrumb-config";

export function AppBreadcrumbs() {
  const pathname = usePathname();

  if (!shouldShowBreadcrumbs(pathname)) {
    return null;
  }

  const crumbs = resolveBreadcrumbs(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 text-sm text-text-muted"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const crumbKey = crumb.href ?? `${pathname}-${index}-${crumb.label}`;
        return (
          <span key={crumbKey} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
            ) : null}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="font-medium text-brand-teal hover:text-brand-navy"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-slate-700" : undefined}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
