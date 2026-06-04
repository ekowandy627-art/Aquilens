/** Control point evidence map (Product Spec Sprint 2). */
export const EVIDENCE_MAP_MODES = [
  "acknowledgement",
  "external_system",
  "physical",
] as const;

export type EvidenceMapMode = (typeof EVIDENCE_MAP_MODES)[number];

export type EvidenceMap = {
  mode?: EvidenceMapMode;
  systemName?: string;
  locationDescription?: string;
  notes?: string;
  /** True when migrated from legacy evidence_required without a completed map. */
  needsCompletion?: boolean;
};

export const EVIDENCE_MAP_MODE_LABELS: Record<EvidenceMapMode, string> = {
  acknowledgement: "Training / acknowledgement record",
  external_system: "External system",
  physical: "Physical location",
};

export function emptyEvidenceMap(): EvidenceMap {
  return {};
}

export function evidenceMapFromLegacy(evidenceRequired: boolean): EvidenceMap {
  if (!evidenceRequired) {
    return {};
  }
  return {
    mode: "acknowledgement",
    needsCompletion: true,
  };
}

export function normalizeEvidenceMap(value: unknown): EvidenceMap {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const mode = raw.mode;
  const map: EvidenceMap = {};
  if (
    typeof mode === "string" &&
    (EVIDENCE_MAP_MODES as readonly string[]).includes(mode)
  ) {
    map.mode = mode as EvidenceMapMode;
  }
  if (typeof raw.systemName === "string") {
    map.systemName = raw.systemName;
  }
  if (typeof raw.locationDescription === "string") {
    map.locationDescription = raw.locationDescription;
  }
  if (typeof raw.notes === "string") {
    map.notes = raw.notes;
  }
  if (raw.needsCompletion === true) {
    map.needsCompletion = true;
  }
  return map;
}

export function isEvidenceMapComplete(map: EvidenceMap) {
  if (!map.mode) {
    return false;
  }
  if (map.needsCompletion) {
    return false;
  }
  if (map.mode === "external_system") {
    return Boolean(map.systemName?.trim());
  }
  if (map.mode === "physical") {
    return Boolean(map.locationDescription?.trim());
  }
  return true;
}
