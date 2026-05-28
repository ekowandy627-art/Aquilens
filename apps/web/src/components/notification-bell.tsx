"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  type NotificationItem,
} from "@/lib/notifications";

function NotificationIcon({ type }: { type: string }) {
  if (type.startsWith("task")) {
    return <Clock3 className="size-4 text-brand-teal" aria-hidden="true" />;
  }
  if (type.startsWith("approval") || type === "sop_approved") {
    return (
      <ClipboardCheck className="size-4 text-brand-teal" aria-hidden="true" />
    );
  }
  if (type.startsWith("attestation")) {
    return (
      <ShieldAlert className="size-4 text-red-600" aria-hidden="true" />
    );
  }
  return <Bell className="size-4 text-brand-teal" aria-hidden="true" />;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousUnreadRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [recent, countResult] = await Promise.all([
        fetchNotifications(),
        fetchUnreadNotificationCount(),
      ]);
      setItems(recent.slice(0, 10));
      const nextCount = countResult.count;
      if (
        previousUnreadRef.current !== null &&
        nextCount > previousUnreadRef.current
      ) {
        setPulse(true);
        if (pulseTimeoutRef.current !== null) {
          window.clearTimeout(pulseTimeoutRef.current);
        }
        pulseTimeoutRef.current = window.setTimeout(() => {
          setPulse(false);
          pulseTimeoutRef.current = null;
        }, 1600);
      }
      previousUnreadRef.current = nextCount;
      setUnreadCount(nextCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
      previousUnreadRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => {
      window.clearInterval(interval);
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, [refresh]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await refresh();
  }

  async function handleOpenNotification(item: NotificationItem) {
    if (!item.isRead) {
      await markNotificationRead(item.id);
      setUnreadCount((count) => {
        const next = Math.max(0, count - 1);
        previousUnreadRef.current = next;
        return next;
      });
    }
    setOpen(false);
    router.push(notificationHref(item));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "relative grid size-9 place-items-center rounded-md border border-border text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950",
          pulse && "animate-bounce",
        )}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell
          className={clsx("size-4", pulse && "text-brand-teal")}
          aria-hidden="true"
        />
        {unreadCount > 0 ? (
          <span
            className={clsx(
              "absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white",
              pulse
                ? "animate-ping"
                : "animate-in fade-in zoom-in duration-200",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-md border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal hover:text-brand-navy"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 px-4 py-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`skel-${index}`} className="flex gap-3">
                    <div className="size-8 shrink-0 animate-pulse rounded-md bg-slate-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-muted">
                No notifications yet.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleOpenNotification(item)}
                  className={clsx(
                    "flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-slate-50",
                    !item.isRead && "bg-teal-50/40",
                  )}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-slate-100">
                    <NotificationIcon type={item.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-950">
                      {item.title}
                    </span>
                    {item.entityName ? (
                      <span className="mt-0.5 block truncate text-xs text-text-muted">
                        {item.entityName}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-text-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-brand-teal hover:text-brand-navy"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
