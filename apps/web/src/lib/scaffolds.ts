export type InstitutionType =
  | "school"
  | "hospital"
  | "financial_services"
  | "ngo"
  | "corporate"
  | "government";

export type FunctionNode = {
  id: string;
  name: string;
  description?: string;
  areas: ProcessAreaNode[];
};

export type ProcessAreaNode = {
  id: string;
  name: string;
  description?: string;
};

export type TenantProfile = {
  name: string;
  institutionType: InstitutionType;
  country: string;
  onboardingComplete: boolean;
  functions: FunctionNode[];
};

export const institutionTypeLabels: Record<InstitutionType, string> = {
  school: "School",
  hospital: "Hospital",
  financial_services: "Financial Services",
  ngo: "NGO",
  corporate: "Corporate",
  government: "Government",
};

type ScaffoldTemplate = Array<{
  name: string;
  areas: string[];
}>;

const scaffolds: Record<InstitutionType, ScaffoldTemplate> = {
  school: [
    {
      name: "Academics",
      areas: ["Student Records", "Curriculum", "Assessment", "Timetabling"],
    },
    {
      name: "Admissions",
      areas: ["Enquiries", "Enrolment", "Scholarships"],
    },
    {
      name: "Finance",
      areas: ["Fees & Billing", "Payroll", "Procurement"],
    },
    {
      name: "HR",
      areas: ["Recruitment", "Staff Records", "Performance"],
    },
    {
      name: "Operations",
      areas: ["Facilities", "Health & Safety", "Transport"],
    },
    {
      name: "IT",
      areas: ["Systems", "Data Management", "Helpdesk"],
    },
  ],
  hospital: [
    {
      name: "Clinical",
      areas: ["Patient Admissions", "Wards", "Theatre", "Emergency"],
    },
    {
      name: "Pharmacy",
      areas: ["Dispensing", "Procurement", "Controlled Drugs"],
    },
    {
      name: "Nursing",
      areas: ["Ward Staffing", "Patient Handover", "Care Plans"],
    },
    {
      name: "Admissions",
      areas: ["Registration", "Insurance Checks", "Discharge"],
    },
    {
      name: "Finance",
      areas: ["Billing", "Payroll", "Procurement"],
    },
    {
      name: "IT",
      areas: ["Systems", "Data", "Security"],
    },
  ],
  financial_services: [
    {
      name: "Operations",
      areas: ["Customer Onboarding", "Trade Settlement", "Reconciliation"],
    },
    {
      name: "Risk & Compliance",
      areas: ["Operational Risk", "Regulatory Reporting", "Policy Attestation"],
    },
    {
      name: "Treasury",
      areas: ["Liquidity", "FX", "Counterparty Management"],
    },
    {
      name: "Finance",
      areas: ["Accounting", "Procurement", "Management Reporting"],
    },
    {
      name: "IT",
      areas: ["Systems", "Access Control", "Change Management"],
    },
    {
      name: "Audit",
      areas: ["Internal Audit", "Findings", "Remediation Tracking"],
    },
  ],
  ngo: [
    {
      name: "Programmes",
      areas: ["Grant Management", "Beneficiary Records", "Field Delivery"],
    },
    {
      name: "Fundraising",
      areas: ["Donor Reporting", "Campaigns", "Partnerships"],
    },
    {
      name: "Finance",
      areas: ["Disbursements", "Procurement", "Budget Controls"],
    },
    {
      name: "HR",
      areas: ["Recruitment", "Staff Records", "Safeguarding"],
    },
    {
      name: "Operations",
      areas: ["Fleet", "Facilities", "Security"],
    },
    {
      name: "M&E",
      areas: ["Indicators", "Evidence Collection", "Impact Reporting"],
    },
  ],
  corporate: [
    {
      name: "Operations",
      areas: ["Service Delivery", "Quality", "Vendor Management"],
    },
    {
      name: "Finance",
      areas: ["Billing", "Payroll", "Procurement"],
    },
    {
      name: "HR",
      areas: ["Recruitment", "Performance", "Staff Records"],
    },
    {
      name: "IT",
      areas: ["Systems", "Security", "Support"],
    },
    {
      name: "Legal & Compliance",
      areas: ["Contracts", "Policies", "Regulatory Filings"],
    },
    {
      name: "Sales",
      areas: ["Pipeline", "Contracting", "Customer Handover"],
    },
  ],
  government: [
    {
      name: "Service Delivery",
      areas: ["Citizen Requests", "Case Processing", "Field Operations"],
    },
    {
      name: "Finance",
      areas: ["Budgeting", "Payments", "Procurement"],
    },
    {
      name: "HR",
      areas: ["Recruitment", "Staff Records", "Performance"],
    },
    {
      name: "Procurement",
      areas: ["Tendering", "Supplier Management", "Contract Awards"],
    },
    {
      name: "Audit & Oversight",
      areas: ["Reviews", "Findings", "Corrective Actions"],
    },
  ],
};

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function createScaffold(type: InstitutionType): FunctionNode[] {
  return scaffolds[type].map((fn) => ({
    id: `fn-${slug(type)}-${slug(fn.name)}`,
    name: fn.name,
    areas: fn.areas.map((area) => ({
      id: `area-${slug(type)}-${slug(fn.name)}-${slug(area)}`,
      name: area,
    })),
  }));
}

export const defaultTenantProfile: TenantProfile = {
  name: "Ghana International School",
  institutionType: "school",
  country: "Ghana",
  onboardingComplete: false,
  functions: createScaffold("school"),
};
