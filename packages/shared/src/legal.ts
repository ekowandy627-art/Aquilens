/**
 * Required product disclaimer (PRD §4 / aquilens_standards_repository.md §2).
 * Single source of truth for web UI and export footers.
 */
export const LEGAL_DISCLAIMER =
  "Aquilens helps organisations structure SOPs, controls, reviews and evidence against selected standards, regulations and guidance areas. Aquilens does not certify organisations, replace legal advice, or guarantee compliance. Final responsibility for compliance remains with the organisation and its appointed advisers, auditors, regulators or certification bodies.";

/** Shorter line for PDF page footers. */
export const LEGAL_DISCLAIMER_FOOTER =
  "Aquilens does not certify organisations, replace legal advice, or guarantee compliance.";

/**
 * Terms that must not appear in user-facing product copy (implies certification).
 * Role names like "Compliance Officer" and department names are allowed — scan whole phrases.
 */
export const FORBIDDEN_UI_TERMS = [
  "compliant",
  "certified",
  "you are certified",
  "compliance dashboard",
  "guarantee compliance",
  "regulator-approved",
  "regulator approved",
  "legally compliant",
  "iso-approved",
  "iso approved",
  "cqc-compliant",
  "fca-compliant",
  "passed audit",
  "guaranteed",
] as const;

export type ForbiddenUiTerm = (typeof FORBIDDEN_UI_TERMS)[number];

export function assertSafeLabel(label: string): void {
  const lower = label.toLowerCase();
  for (const term of FORBIDDEN_UI_TERMS) {
    if (lower.includes(term)) {
      throw new Error(`Forbidden product language: "${term}" in label`);
    }
  }
}

export function findForbiddenTermsInText(text: string): ForbiddenUiTerm[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_UI_TERMS.filter((term) => lower.includes(term));
}
