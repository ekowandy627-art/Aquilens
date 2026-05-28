export const ATTESTATION_INTERVALS_DAYS = {
  high: 90,
  medium: 180,
  low: 365,
} as const;

export type RiskClassification = keyof typeof ATTESTATION_INTERVALS_DAYS;

export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function calculateNextAttestationDue(
  lastAttestedAt: string,
  riskClassification: RiskClassification,
): string {
  const interval = ATTESTATION_INTERVALS_DAYS[riskClassification];
  return addDays(lastAttestedAt, interval);
}

export function attestationStatus(
  nextAttestationDue: string | undefined,
  now = new Date(),
): "current" | "due" | "overdue" | "unknown" {
  if (!nextAttestationDue) {
    return "unknown";
  }
  const due = new Date(nextAttestationDue);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / msPerDay);
  if (daysUntilDue < 0) {
    return "overdue";
  }
  if (daysUntilDue <= 14) {
    return "due";
  }
  return "current";
}
