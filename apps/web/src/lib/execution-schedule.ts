export type WeeklyAnchor =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ExecutionSchedule =
  | { kind: "ad_hoc" }
  | { kind: "daily"; timezone?: string }
  | {
      kind: "weekly";
      interval?: number;
      anchor: WeeklyAnchor;
      timezone?: string;
    }
  | {
      kind: "monthly";
      interval?: number;
      dayOfMonth: number;
      timezone?: string;
    }
  | {
      kind: "relative";
      offsetDays: number;
      relativeTo: { type: "calendar_event"; key: string };
    };

export type ProcessPersonRole = "owner" | "editor" | "viewer" | "approver";

export const defaultExecutionSchedule: ExecutionSchedule = { kind: "ad_hoc" };

export function formatExecutionSchedule(schedule: ExecutionSchedule | null | undefined) {
  if (!schedule || schedule.kind === "ad_hoc") {
    return "Ad hoc (when needed)";
  }

  if (schedule.kind === "daily") {
    return "Daily";
  }

  if (schedule.kind === "weekly") {
    const interval = schedule.interval ?? 1;
    const day = schedule.anchor.charAt(0).toUpperCase() + schedule.anchor.slice(1);
    return interval === 1 ? `Every ${day}` : `Every ${interval} weeks on ${day}`;
  }

  if (schedule.kind === "monthly") {
    const suffix = ordinalSuffix(schedule.dayOfMonth);
    return `Monthly on the ${schedule.dayOfMonth}${suffix}`;
  }

  if (schedule.kind === "relative") {
    const direction = schedule.offsetDays < 0 ? "before" : "after";
    const days = Math.abs(schedule.offsetDays);
    const label = schedule.relativeTo.key.replace(/_/g, " ");
    return `${days} day${days === 1 ? "" : "s"} ${direction} ${label}`;
  }

  return "Custom schedule";
}

export function formatReviewFrequency(value: string | null | undefined) {
  switch (value) {
    case "monthly":
      return "Monthly SOP review";
    case "quarterly":
      return "Quarterly SOP review";
    case "annually":
      return "Annual SOP review";
    case "risk_based":
      return "Risk-based SOP review";
    default:
      return value ? `${value} SOP review` : "Not set";
  }
}

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
