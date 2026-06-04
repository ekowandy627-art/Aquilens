export function demoSchoolScaffold() {
  return [
    {
      id: "fn-school-academics",
      name: "Academics",
      ownerId: "user-gis-owner",
      areas: [
        { id: "area-school-academics-student-records", name: "Student Records" },
        { id: "area-school-academics-curriculum", name: "Curriculum" },
        { id: "area-school-academics-assessment", name: "Assessment" },
        { id: "area-school-academics-timetabling", name: "Timetabling" },
      ],
    },
    {
      id: "fn-school-admissions",
      name: "Admissions",
      ownerId: "user-gis-owner",
      areas: [
        { id: "area-school-admissions-enquiries", name: "Enquiries" },
        { id: "area-school-admissions-enrolment", name: "Enrolment" },
        { id: "area-school-admissions-scholarships", name: "Scholarships" },
      ],
    },
    {
      id: "fn-school-finance",
      name: "Finance",
      ownerId: "user-gis-compliance",
      areas: [
        { id: "area-school-finance-fees-billing", name: "Fees & Billing" },
        { id: "area-school-finance-payroll", name: "Payroll" },
        { id: "area-school-finance-procurement", name: "Procurement" },
      ],
    },
    {
      id: "fn-school-hr",
      name: "HR",
      areas: [
        { id: "area-school-hr-recruitment", name: "Recruitment" },
        { id: "area-school-hr-staff-records", name: "Staff Records" },
        { id: "area-school-hr-performance", name: "Performance" },
      ],
    },
    {
      id: "fn-school-operations",
      name: "Operations",
      areas: [
        { id: "area-school-operations-facilities", name: "Facilities" },
        { id: "area-school-operations-health-safety", name: "Health & Safety" },
        { id: "area-school-operations-transport", name: "Transport" },
      ],
    },
    {
      id: "fn-school-it",
      name: "IT",
      areas: [
        { id: "area-school-it-systems", name: "Systems" },
        { id: "area-school-it-data-management", name: "Data Management" },
        { id: "area-school-it-helpdesk", name: "Helpdesk" },
      ],
    },
  ];
}

/** Manufacturing demo tenant scaffold (Product Spec Sprint 1 dual demo). */
export function demoManufacturingScaffold() {
  return [
    {
      id: "fn-mfg-production",
      name: "Production",
      ownerId: "user-mfg-owner",
      areas: [
        { id: "area-mfg-production-blending", name: "Blending & Mixing" },
        { id: "area-mfg-production-packaging", name: "Packaging" },
        { id: "area-mfg-production-release", name: "Batch Release" },
      ],
    },
    {
      id: "fn-mfg-quality",
      name: "Quality",
      ownerId: "user-mfg-compliance",
      areas: [
        { id: "area-mfg-quality-inspection", name: "Inspection" },
        { id: "area-mfg-quality-hold", name: "Hold & Release" },
        { id: "area-mfg-quality-lab", name: "Laboratory" },
      ],
    },
    {
      id: "fn-mfg-supply-chain",
      name: "Supply Chain",
      areas: [
        { id: "area-mfg-supply-procurement", name: "Procurement" },
        { id: "area-mfg-supply-inbound", name: "Inbound Logistics" },
        { id: "area-mfg-supply-dispatch", name: "Dispatch" },
      ],
    },
    {
      id: "fn-mfg-maintenance",
      name: "Maintenance",
      areas: [
        { id: "area-mfg-maintenance-preventive", name: "Preventive Maintenance" },
        { id: "area-mfg-maintenance-calibration", name: "Calibration" },
      ],
    },
    {
      id: "fn-mfg-hse",
      name: "Health, Safety & Environment",
      areas: [
        { id: "area-mfg-hse-incidents", name: "Incidents" },
        { id: "area-mfg-hse-waste", name: "Waste Management" },
      ],
    },
    {
      id: "fn-mfg-it",
      name: "IT",
      areas: [
        { id: "area-mfg-it-systems", name: "Manufacturing Systems" },
        { id: "area-mfg-it-access", name: "Access Control" },
      ],
    },
  ];
}

export function demoScaffoldForTenant(tenantId: string) {
  if (tenantId === "tenant-mfg") {
    return demoManufacturingScaffold();
  }
  return demoSchoolScaffold();
}
