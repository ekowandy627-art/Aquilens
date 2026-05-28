import { LEGAL_DISCLAIMER } from "@aquilens/shared";
import type {
  GuidancePackRecord,
  GuidanceRequirementRecord,
} from "./guidance.types";

function requirement(
  packId: string,
  sortOrder: number,
  requirementArea: string,
  summary: string,
  options: Partial<GuidanceRequirementRecord> = {},
): GuidanceRequirementRecord {
  const id = `${packId}-req-${String(sortOrder).padStart(2, "0")}`;
  return {
    id,
    packId,
    requirementArea,
    summary,
    appliesTo: options.appliesTo ?? "organisation",
    referenceCode: options.referenceCode,
    suggestedSopTitles: options.suggestedSopTitles ?? [],
    requiredControls: options.requiredControls ?? [],
    evidenceExpected: options.evidenceExpected ?? [],
    riskIfMissing: options.riskIfMissing,
    auditChecks: options.auditChecks ?? [
      { id: `${id}-check-1`, question: `Is there evidence for ${requirementArea}?` },
    ],
    sortOrder,
  };
}

const PACKS: GuidancePackRecord[] = [
  {
    id: "pack-universal-sop-control",
    slug: "universal-sop-control",
    name: "Universal SOP Control Pack",
    packType: "guidance_area",
    sector: ["general"],
    jurisdiction: ["global"],
    versionLabel: "PACK-AQL-000 v1",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Minimum SOP control expectations for every tenant: ownership, versioning, approval, review, and evidence.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "pack-iso-9001-quality",
    slug: "iso-9001-quality",
    name: "ISO 9001 Quality Management Pack",
    packType: "standard",
    sector: ["manufacturing", "general", "education"],
    jurisdiction: ["global"],
    versionLabel: "ISO 9001:2015 + Amd 1:2024 (summary)",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Quality management system guidance: process approach, customer focus, internal audit, and continual improvement.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "pack-school-operations",
    slug: "school-operations",
    name: "School Operations Guidance Pack",
    packType: "guidance_area",
    sector: ["education"],
    jurisdiction: ["UK", "Ghana", "global"],
    versionLabel: "Composite v1 (safeguarding + inspection + safety)",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Safeguarding, inspection readiness, and school safety expectations for education tenants.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "pack-health-and-care",
    slug: "health-and-care",
    name: "Health and Social Care Pack",
    packType: "regulation",
    sector: ["healthcare"],
    jurisdiction: ["UK"],
    versionLabel: "CQC-aligned summary v1",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Safe, effective, caring, responsive, and well-led service expectations for regulated care providers.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "pack-iso-27001-security",
    slug: "iso-27001-security",
    name: "ISO/IEC 27001 Information Security Pack",
    packType: "standard",
    sector: ["general", "education", "healthcare", "financial_services"],
    jurisdiction: ["global"],
    versionLabel: "ISO/IEC 27001 summary v1",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Information security management: risk assessment, access control, incident response, and supplier security.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "pack-iso-45001-hse",
    slug: "iso-45001-hse",
    name: "ISO 45001 Health and Safety Pack",
    packType: "standard",
    sector: ["general", "education", "manufacturing"],
    jurisdiction: ["global", "UK", "Ghana"],
    versionLabel: "ISO 45001 summary v1",
    effectiveDate: "2026-01-01",
    disclaimer: LEGAL_DISCLAIMER,
    summary:
      "Occupational health and safety management: hazard identification, worker participation, and emergency preparedness.",
    isActive: true,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
];

const REQUIREMENTS: GuidanceRequirementRecord[] = [
  ...[
    "SOP ownership",
    "Version control",
    "Approval workflow",
    "Review cycle",
    "Change log",
    "Evidence links",
    "Staff acknowledgement",
    "Audit trail",
    "Retirement and archive",
    "Corrective actions",
  ].map((area, index) =>
    requirement("pack-universal-sop-control", index + 1, area, `Maintain ${area.toLowerCase()} for controlled SOPs.`),
  ),
  ...[
    "Context of the organisation",
    "Leadership and accountability",
    "Process approach",
    "Risk and opportunities",
    "Documented information",
    "Customer requirements",
    "Nonconformity and corrective action",
    "Internal audit",
    "Management review",
    "Continual improvement",
  ].map((area, index) =>
    requirement("pack-iso-9001-quality", index + 1, area, `Demonstrate ${area.toLowerCase()} within the quality management system.`),
  ),
  ...[
    "Safeguarding policy and culture",
    "Safer recruitment",
    "Staff training and DSL oversight",
    "Reporting and managing concerns",
    "Single central record",
    "Online safety",
    "Inspection readiness",
    "Governance and leadership",
    "Site safety and emergency planning",
    "Trip and activity risk assessment",
    "Child protection reporting (Ghana context)",
    "Health and safety committee",
  ].map((area, index) =>
    requirement("pack-school-operations", index + 1, area, `School must address ${area.toLowerCase()}.`, {
      appliesTo: index < 6 ? "organisation" : "department",
    }),
  ),
  ...[
    "Safe care and treatment",
    "Effective care",
    "Caring culture",
    "Responsive services",
    "Well-led governance",
    "Medicines management",
    "Infection prevention",
    "Staffing and competence",
    "Premises and equipment",
    "Records and information governance",
  ].map((area, index) =>
    requirement("pack-health-and-care", index + 1, area, `CQC-style expectation: ${area}.`),
  ),
  ...[
    "Information security policy",
    "Risk assessment",
    "Access control",
    "Cryptography",
    "Physical security",
    "Operations security",
    "Supplier relationships",
    "Incident management",
    "Business continuity",
    "Compliance monitoring",
  ].map((area, index) =>
    requirement("pack-iso-27001-security", index + 1, area, `Security control area: ${area}.`),
  ),
  ...[
    "OH&S policy",
    "Hazard identification",
    "Legal and other requirements",
    "Objectives and planning",
    "Competence and awareness",
    "Operational control",
    "Emergency preparedness",
    "Incident investigation",
    "Monitoring and measurement",
    "Management review",
  ].map((area, index) =>
    requirement("pack-iso-45001-hse", index + 1, area, `Health and safety: ${area}.`),
  ),
];

export function buildMvpGuidanceSeed() {
  return {
    packs: PACKS,
    requirements: REQUIREMENTS,
  };
}
