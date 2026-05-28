"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { CardListSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PrimaryButton } from "@/components/primary-button";
import {
  createEscalationRule,
  fetchEscalationRules,
  toggleEscalationRule,
  type EscalationRule,
} from "@/lib/dashboard";

export default function EscalationSettingsPage() {
  return (
    <PermissionGate permission="settings:manage">
      <EscalationSettingsContent />
    </PermissionGate>
  );
}

function EscalationSettingsContent() {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchEscalationRules();
        if (!cancelled) {
          setRules(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load escalation rules",
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
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEscalationRules();
      setRules(data);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load escalation rules",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await createEscalationRule({
        name: "Custom SLA Escalation",
        triggerEvent: "task_sla_missed",
        levels: [
          { levelNumber: 1, targetRole: "Staff", delayHours: 0 },
          { levelNumber: 2, targetRole: "Super Admin", delayHours: 12 },
        ],
      });
      await load();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create escalation rule",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string) {
    await toggleEscalationRule(id);
    await load();
  }

  return (
    <>
      <PageHeader
        title="Escalation"
        description="Configure who gets notified when SLAs are missed or work goes overdue."
        action={
          <PrimaryButton disabled={creating} onClick={() => void handleCreate()}>
            {creating ? "Creating…" : "Create rule"}
          </PrimaryButton>
        }
      />

      {loading ? (
        <div className="rounded-md border border-border bg-white p-6 text-sm text-text-muted">
          <CardListSkeleton rows={3} />
        </div>
      ) : error ? (
        <div className="rounded-md border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No escalation rules"
          description="Create a rule to notify the right roles when work is overdue."
        />
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-md border border-border bg-white p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      {rule.name}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        rule.isActive
                          ? "bg-teal-50 text-teal-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    Trigger: {rule.triggerEvent.replace(/_/g, " ")}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {rule.levels.map((level) => (
                      <li
                        key={level.id}
                        className="rounded-md border border-border bg-surface-bg px-3 py-2 text-sm"
                      >
                        Level {level.levelNumber}: notify{" "}
                        <span className="font-medium">{level.targetRole}</span>
                        {level.delayHours > 0
                          ? ` after ${level.delayHours} hours`
                          : " immediately"}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggle(rule.id)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {rule.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
