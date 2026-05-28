"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/list-table-skeleton";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  type NotificationItem,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeFilter = useMemo(
    () => (filter === "all" ? undefined : { isRead: filter === "read" }),
    [filter],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchNotifications(activeFilter);
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load notifications",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchNotifications(activeFilter);
      setItems(data);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load notifications",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    await load();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await load();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="All alerts for tasks, approvals, workflows, and attestations."
        action={
          items.some((item) => !item.isRead) ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        {(["all", "unread", "read"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              filter === value
                ? "bg-brand-navy text-white"
                : "border border-border bg-white text-slate-700"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-md border border-border bg-white p-6 text-sm text-text-muted">
          <CardListSkeleton rows={6} />
        </div>
      ) : error ? (
        <div className="rounded-md border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex flex-col gap-3 border-b border-border px-5 py-4 last:border-0 md:flex-row md:items-center md:justify-between ${
                  !item.isRead ? "bg-teal-50/40" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  {item.body ? (
                    <p className="mt-1 text-sm text-text-muted">{item.body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-text-muted">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.entityName ? ` · ${item.entityName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(item.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Mark read
                    </button>
                  ) : null}
                  <Link
                    href={notificationHref(item)}
                    className="rounded-md bg-brand-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-navy/90"
                  >
                    Go to record
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
