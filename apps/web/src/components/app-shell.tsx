"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { navItems, settingsNavItem, titleFromPathname } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const title = titleFromPathname(pathname);

  return (
    <div className="flex min-h-screen bg-surface-bg text-foreground">
      <aside
        className={clsx(
          "flex shrink-0 flex-col border-r border-border bg-white transition-all duration-200",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-navy text-sm font-semibold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-navy">
                Aquilens
              </p>
              <p className="truncate text-xs text-text-muted">
                Governance backbone
              </p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-navy text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <div className="mt-auto">
            <Link
              href={settingsNavItem.href}
              title={collapsed ? settingsNavItem.label : undefined}
              className={clsx(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                pathname.startsWith(settingsNavItem.href)
                  ? "bg-brand-navy text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                collapsed && "justify-center px-0",
              )}
            >
              <settingsNavItem.icon className="size-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{settingsNavItem.label}</span>}
            </Link>
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="m-3 flex h-9 items-center justify-center rounded-md border border-border bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="size-4" aria-hidden="true" />
          )}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
          <div>
            <p className="text-xs font-medium text-text-muted">Aquilens</p>
            <h1 className="text-base font-semibold text-slate-950">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-md border border-border text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
              aria-label="Notifications"
            >
              <Bell className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-md border border-border px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              aria-label="Open user menu"
            >
              <span className="grid size-6 place-items-center rounded-full bg-slate-100">
                <UserRound className="size-3.5" aria-hidden="true" />
              </span>
              <span className="hidden md:inline">Victor Hazel</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
