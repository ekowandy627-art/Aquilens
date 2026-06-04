/** Controlled taxonomy for operating and output-market jurisdictions (Product Spec Sprint 1). */
export const JURISDICTION_TAXONOMY = [
  "ghana",
  "uk",
  "eu",
  "us_fda",
  "us_general",
  "canada",
  "australia",
  "global",
] as const;

export type JurisdictionCode = (typeof JURISDICTION_TAXONOMY)[number];

export const JURISDICTION_LABELS: Record<JurisdictionCode, string> = {
  ghana: "Ghana",
  uk: "United Kingdom",
  eu: "European Union",
  us_fda: "United States (FDA)",
  us_general: "United States (general)",
  canada: "Canada",
  australia: "Australia",
  global: "Global / multi-region",
};

export function isJurisdictionCode(value: string): value is JurisdictionCode {
  return (JURISDICTION_TAXONOMY as readonly string[]).includes(value);
}

export function normalizeJurisdictionList(values: string[] | undefined) {
  if (!values?.length) {
    return [] as JurisdictionCode[];
  }
  const normalized: JurisdictionCode[] = [];
  for (const raw of values) {
    const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
    if (isJurisdictionCode(key) && !normalized.includes(key)) {
      normalized.push(key);
    }
  }
  return normalized;
}
