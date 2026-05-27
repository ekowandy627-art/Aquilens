"use client";

import type { ExecutionSchedule, WeeklyAnchor } from "@/lib/execution-schedule";
import { defaultExecutionSchedule } from "@/lib/execution-schedule";

type ExecutionScheduleFieldsProps = {
  value: ExecutionSchedule;
  onChange: (value: ExecutionSchedule) => void;
  readOnly?: boolean;
};

const weeklyAnchors: WeeklyAnchor[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function ExecutionScheduleFields({
  value,
  onChange,
  readOnly = false,
}: ExecutionScheduleFieldsProps) {
  if (readOnly) {
    return null;
  }

  return (
    <div className="grid gap-4 md:col-span-2">
      <Field
        label="How often is this process performed?"
        hint="Operational cadence — when the work actually happens."
      >
        <select
          value={value.kind}
          onChange={(event) => {
            const kind = event.target.value as ExecutionSchedule["kind"];
            if (kind === "daily") onChange({ kind: "daily" });
            else if (kind === "weekly")
              onChange({ kind: "weekly", anchor: "monday" });
            else if (kind === "monthly")
              onChange({ kind: "monthly", dayOfMonth: 1 });
            else if (kind === "relative")
              onChange({
                kind: "relative",
                offsetDays: -5,
                relativeTo: { type: "calendar_event", key: "term_start" },
              });
            else onChange(defaultExecutionSchedule);
          }}
          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="ad_hoc">Ad hoc (when needed)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="relative">Relative to a calendar event</option>
        </select>
      </Field>

      {value.kind === "weekly" ? (
        <Field label="Day of week">
          <select
            value={value.anchor}
            onChange={(event) =>
              onChange({
                ...value,
                anchor: event.target.value as WeeklyAnchor,
              })
            }
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
          >
            {weeklyAnchors.map((anchor) => (
              <option key={anchor} value={anchor}>
                {anchor.charAt(0).toUpperCase() + anchor.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {value.kind === "monthly" ? (
        <Field label="Day of month">
          <input
            type="number"
            min={1}
            max={28}
            value={value.dayOfMonth}
            onChange={(event) =>
              onChange({
                ...value,
                dayOfMonth: Number(event.target.value) || 1,
              })
            }
            className="h-10 w-full rounded-md border border-border px-3 text-sm"
          />
        </Field>
      ) : null}

      {value.kind === "relative" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Days offset (negative = before)">
            <input
              type="number"
              value={value.offsetDays}
              onChange={(event) =>
                onChange({
                  ...value,
                  offsetDays: Number(event.target.value) || 0,
                })
              }
              className="h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </Field>
          <Field label="Relative to">
            <select
              value={value.relativeTo.key}
              onChange={(event) =>
                onChange({
                  ...value,
                  relativeTo: {
                    type: "calendar_event",
                    key: event.target.value,
                  },
                })
              }
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="term_start">Term start</option>
              <option value="term_end">Term end</option>
              <option value="reporting_deadline">Reporting deadline</option>
            </select>
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-950">{label}</span>
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}
