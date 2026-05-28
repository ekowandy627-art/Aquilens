import { seedApproval } from "../approvals/approval-demo.store";
import { generateProcessCode } from "./process-code";
import { defaultExecutionSchedule } from "./execution-schedule";
import type {
  ProcessPersonRecord,
  ProcessRecord,
  ProcessStepRecord,
  ProcessVersionRecord,
} from "./process-demo.store";

type DemoScaffoldNames = {
  functionId: string;
  functionName: string;
  areaId: string;
  areaName: string;
};

const gisScaffold: DemoScaffoldNames[] = [
  {
    functionId: "fn-school-academics",
    functionName: "Academics",
    areaId: "area-school-academics-student-records",
    areaName: "Student Records",
  },
  {
    functionId: "fn-school-admissions",
    functionName: "Admissions",
    areaId: "area-school-admissions-enrolment",
    areaName: "Enrolment",
  },
  {
    functionId: "fn-school-finance",
    functionName: "Finance",
    areaId: "area-school-finance-fees-billing",
    areaName: "Fees & Billing",
  },
];

const hrScaffold: DemoScaffoldNames = {
  functionId: "fn-school-hr",
  functionName: "HR",
  areaId: "area-school-hr-recruitment",
  areaName: "Recruitment",
};

function seedProcess(
  tenantId: string,
  scaffold: DemoScaffoldNames,
  input: {
    id: string;
    name: string;
    status: ProcessRecord["status"];
    riskRating: ProcessRecord["riskRating"];
    sequence: number;
    versionStatus: ProcessVersionRecord["status"];
    createdBy: string;
    reviewFrequency?: string;
    executionSchedule?: ProcessRecord["executionSchedule"];
    people?: Array<{ userId: string; role: ProcessPersonRecord["role"] }>;
    creationSource?: ProcessRecord["creationSource"];
    processCode?: string;
    approvalRequired?: boolean;
    steps: Array<{
      title: string;
      description?: string;
      stepType?: ProcessStepRecord["stepType"];
      evidenceRequired?: boolean;
    }>;
  },
) {
  const versionId = `${input.id}-v1`;
  const now = "2026-05-26T10:00:00.000Z";

  const process: ProcessRecord = {
    id: input.id,
    tenantId,
    functionId: scaffold.functionId,
    processAreaId: scaffold.areaId,
    functionName: scaffold.functionName,
    processAreaName: scaffold.areaName,
    processCode:
      input.processCode ??
      generateProcessCode(
        scaffold.functionName,
        scaffold.areaName,
        input.sequence,
      ),
    name: input.name,
    purpose: input.name,
    whoItAffects: [],
    linkedSystems: [],
    tags: [],
    riskRating: input.riskRating,
    governanceControls: [],
    approvalRequired: input.approvalRequired ?? true,
    reviewFrequency: input.reviewFrequency ?? "annually",
    executionSchedule: input.executionSchedule ?? defaultExecutionSchedule,
    creationSource: input.creationSource ?? "manual",
    participants: [],
    relatedDocuments: [],
    acknowledgementRequired: false,
    status: input.status,
    currentVersionId: versionId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const version: ProcessVersionRecord = {
    id: versionId,
    tenantId,
    processId: input.id,
    versionNumber: 1,
    status: input.versionStatus,
    createdBy: input.createdBy,
    createdAt: now,
  };

  const steps: ProcessStepRecord[] = input.steps.map((step, index) => ({
    id: `${versionId}-step-${index + 1}`,
    tenantId,
    processVersionId: versionId,
    stepNumber: index + 1,
    title: step.title,
    description: step.description,
    stepType: step.stepType ?? "manual",
    evidenceRequired: step.evidenceRequired ?? false,
  }));

  return { process, version, steps, people: input.people ?? [] };
}

function clonePeopleForVersion(
  sourceVersionId: string,
  targetVersionId: string,
  people: Map<string, ProcessPersonRecord>,
) {
  for (const person of people.values()) {
    if (person.processVersionId !== sourceVersionId) {
      continue;
    }
    const id = `${targetVersionId}-${person.userId}-${person.role}`;
    people.set(id, {
      ...person,
      id,
      processVersionId: targetVersionId,
    });
  }
}

function addSteps(
  tenantId: string,
  versionId: string,
  steps: Map<string, ProcessStepRecord>,
  stepDefs: Array<{
    title: string;
    description?: string;
    stepType?: ProcessStepRecord["stepType"];
    evidenceRequired?: boolean;
  }>,
) {
  for (const [index, input] of stepDefs.entries()) {
    const step: ProcessStepRecord = {
      id: `${versionId}-step-${index + 1}`,
      tenantId,
      processVersionId: versionId,
      stepNumber: index + 1,
      title: input.title,
      description: input.description,
      stepType: input.stepType ?? "manual",
      evidenceRequired: input.evidenceRequired ?? false,
    };
    steps.set(step.id, step);
  }
}

function addPeople(
  versionId: string,
  people: Map<string, ProcessPersonRecord>,
  rows: Array<{ userId: string; role: ProcessPersonRecord["role"] }>,
) {
  for (const person of rows) {
    people.set(`${versionId}-${person.userId}-${person.role}`, {
      id: `${versionId}-${person.userId}-${person.role}`,
      processVersionId: versionId,
      userId: person.userId,
      role: person.role,
    });
  }
}

export function buildGisRichProcessStore() {
  const processes = new Map<string, ProcessRecord>();
  const versions = new Map<string, ProcessVersionRecord>();
  const steps = new Map<string, ProcessStepRecord>();
  const people = new Map<string, ProcessPersonRecord>();

  const tenantId = "tenant-gis";
  const enrolmentNow = "2026-05-26T10:00:00.000Z";

  const attendanceV1Id = "proc-gis-attendance-v1";
  const attendanceV2Id = "proc-gis-attendance-v2";
  const attendanceProcess: ProcessRecord = {
    id: "proc-gis-attendance",
    tenantId,
    functionId: gisScaffold[0]!.functionId,
    processAreaId: gisScaffold[0]!.areaId,
    functionName: gisScaffold[0]!.functionName,
    processAreaName: gisScaffold[0]!.areaName,
    processCode: "ACAD-STUD-001",
    name: "Record Student Attendance",
    purpose: "Record Student Attendance",
    whoItAffects: [],
    linkedSystems: [],
    tags: [],
    riskRating: "medium",
    governanceControls: [],
    approvalRequired: true,
    reviewFrequency: "quarterly",
    executionSchedule: { kind: "daily", timezone: "Africa/Accra" },
    creationSource: "manual",
    participants: [],
    relatedDocuments: [],
    acknowledgementRequired: false,
    status: "active",
    currentVersionId: attendanceV2Id,
    createdBy: "user-gis-owner",
    createdAt: "2026-05-10T09:00:00.000Z",
    updatedAt: enrolmentNow,
  };

  const attendanceV1: ProcessVersionRecord = {
    id: attendanceV1Id,
    tenantId,
    processId: "proc-gis-attendance",
    versionNumber: 1,
    status: "rejected",
    createdBy: "user-gis-owner",
    createdAt: "2026-05-12T09:00:00.000Z",
    rejectedBy: "user-gis-head",
    rejectedAt: "2026-05-14T10:00:00.000Z",
    rejectionComment: "Missing parent notification step",
  };

  const attendanceV2: ProcessVersionRecord = {
    id: attendanceV2Id,
    tenantId,
    processId: "proc-gis-attendance",
    versionNumber: 2,
    status: "active",
    changeSummary: "Added parent notification step",
    createdBy: "user-gis-owner",
    createdAt: enrolmentNow,
    approvedBy: "user-gis-head",
    approvedAt: enrolmentNow,
    effectiveDate: "2026-05-26",
    reviewDueDate: "2027-05-26",
    publishedAt: enrolmentNow,
    publishedBy: "user-gis-owner",
  };

  const enrolmentV1Id = "proc-gis-enrolment-v1";
  const enrolmentV2Id = "proc-gis-enrolment-v2";
  const enrolmentV3Id = "proc-gis-enrolment-v3";

  const enrolmentProcess: ProcessRecord = {
    id: "proc-gis-enrolment",
    tenantId,
    functionId: gisScaffold[1]!.functionId,
    processAreaId: gisScaffold[1]!.areaId,
    functionName: gisScaffold[1]!.functionName,
    processAreaName: gisScaffold[1]!.areaName,
    processCode: "ADMN-ENR-001",
    name: "Enrol New Student",
    purpose: "Enrol New Student",
    whoItAffects: [],
    linkedSystems: [],
    tags: [],
    riskRating: "high",
    governanceControls: [],
    approvalRequired: true,
    reviewFrequency: "annually",
    executionSchedule: { kind: "ad_hoc" },
    creationSource: "manual",
    participants: [],
    relatedDocuments: [],
    acknowledgementRequired: true,
    status: "active",
    currentVersionId: enrolmentV3Id,
    createdBy: "user-gis-owner",
    createdAt: enrolmentNow,
    updatedAt: enrolmentNow,
  };

  const enrolmentV1: ProcessVersionRecord = {
    id: enrolmentV1Id,
    tenantId,
    processId: "proc-gis-enrolment",
    versionNumber: 1,
    status: "rejected",
    createdBy: "user-gis-owner",
    createdAt: "2026-05-20T10:00:00.000Z",
    rejectedBy: "user-gis-head",
    rejectedAt: "2026-05-21T10:00:00.000Z",
    rejectionComment: "Missing safeguarding step",
  };

  const enrolmentV2: ProcessVersionRecord = {
    id: enrolmentV2Id,
    tenantId,
    processId: "proc-gis-enrolment",
    versionNumber: 2,
    status: "superseded",
    changeSummary: "Added safeguarding review step",
    createdBy: "user-gis-owner",
    createdAt: "2026-05-24T10:00:00.000Z",
    approvedBy: "user-gis-head",
    approvedAt: "2026-05-25T10:00:00.000Z",
  };

  const enrolmentV3: ProcessVersionRecord = {
    id: enrolmentV3Id,
    tenantId,
    processId: "proc-gis-enrolment",
    versionNumber: 3,
    status: "active",
    changeSummary: "Added fee clearance and documentation controls",
    createdBy: "user-gis-owner",
    createdAt: enrolmentNow,
    approvedBy: "user-gis-head",
    approvedAt: enrolmentNow,
    effectiveDate: "2026-05-26",
    reviewDueDate: "2027-05-26",
    publishedAt: enrolmentNow,
    publishedBy: "user-gis-owner",
  };

  const fees = seedProcess(tenantId, gisScaffold[2]!, {
    id: "proc-gis-fees",
    name: "Process Fee Payment",
    processCode: "FIN-FEES-001",
    status: "draft",
    riskRating: "low",
    sequence: 1,
    versionStatus: "draft",
    createdBy: "user-gis-owner",
    reviewFrequency: "annually",
    executionSchedule: {
      kind: "monthly",
      dayOfMonth: 1,
      timezone: "Africa/Accra",
    },
    people: [
      { userId: "user-gis-owner", role: "owner" },
      { userId: "user-gis-head", role: "approver" },
    ],
    steps: [
      { title: "Verify fee schedule against enrolment" },
      { title: "Record payment in finance system" },
      { title: "Issue receipt to guardian" },
      { title: "Reconcile payment with invoice" },
    ],
  });

  const safeguarding = seedProcess(tenantId, gisScaffold[1]!, {
    id: "proc-gis-safeguarding",
    name: "Manage Safeguarding Concern",
    processCode: "ADMN-SAF-001",
    status: "active",
    riskRating: "high",
    sequence: 2,
    versionStatus: "active",
    createdBy: "user-gis-owner",
    creationSource: "ai_generated",
    people: [
      { userId: "user-gis-owner", role: "owner" },
      { userId: "user-gis-compliance", role: "editor" },
      { userId: "user-gis-head", role: "approver" },
    ],
    steps: [
      { title: "Receive and log concern" },
      { title: "Conduct initial risk assessment", stepType: "approval" },
      { title: "Implement safeguarding plan" },
      { title: "Close case with compliance sign-off", evidenceRequired: true },
    ],
  });

  const hrRecruitment = seedProcess(tenantId, hrScaffold, {
    id: "proc-gis-hr-recruitment",
    name: "Recruit New Teacher",
    processCode: "HR-RECR-001",
    status: "under_review",
    riskRating: "medium",
    sequence: 1,
    versionStatus: "under_review",
    createdBy: "user-gis-compliance",
    people: [
      { userId: "user-gis-compliance", role: "owner" },
      { userId: "user-gis-head", role: "approver" },
    ],
    steps: [
      { title: "Define role and advert" },
      { title: "Shortlist candidates" },
      { title: "Conduct interviews", stepType: "approval" },
      { title: "Complete safeguarding checks", evidenceRequired: true },
      { title: "Issue contract" },
    ],
  });

  processes.set(attendanceProcess.id, attendanceProcess);
  processes.set(enrolmentProcess.id, enrolmentProcess);
  versions.set(attendanceV1.id, attendanceV1);
  versions.set(attendanceV2.id, attendanceV2);
  versions.set(enrolmentV1.id, enrolmentV1);
  versions.set(enrolmentV2.id, enrolmentV2);
  versions.set(enrolmentV3.id, enrolmentV3);

  for (const seed of [fees, safeguarding, hrRecruitment]) {
    processes.set(seed.process.id, seed.process);
    versions.set(seed.version.id, seed.version);
    for (const step of seed.steps) {
      steps.set(step.id, step);
    }
    for (const person of seed.people) {
      people.set(`${seed.version.id}-${person.userId}-${person.role}`, {
        id: `${seed.version.id}-${person.userId}-${person.role}`,
        processVersionId: seed.version.id,
        userId: person.userId,
        role: person.role,
      });
    }
  }

  addSteps(tenantId, attendanceV1Id, steps, [
    { title: "Teacher takes register" },
    { title: "Discrepancies flagged to admin" },
  ]);
  addSteps(tenantId, attendanceV2Id, steps, [
    { title: "Teacher takes register", description: "Manual attendance capture" },
    { title: "Discrepancies flagged to admin" },
    { title: "Absence notified to parents" },
  ]);

  addPeople(attendanceV2Id, people, [
    { userId: "user-gis-owner", role: "owner" },
    { userId: "user-gis-head", role: "approver" },
    { userId: "user-gis-staff", role: "viewer" },
  ]);
  clonePeopleForVersion(attendanceV1Id, attendanceV2Id, people);

  addSteps(tenantId, enrolmentV1Id, steps, [
    { title: "Receive application" },
    { title: "Conduct interview", stepType: "approval" },
    { title: "Confirm placement" },
    { title: "Collect documentation", evidenceRequired: true },
  ]);

  addSteps(tenantId, enrolmentV2Id, steps, [
    { title: "Receive application" },
    { title: "Conduct interview", stepType: "approval" },
    { title: "Safeguarding review", stepType: "approval" },
    { title: "Confirm placement" },
    { title: "Collect documentation", evidenceRequired: true },
    { title: "Create student record in SIS" },
  ]);

  addSteps(tenantId, enrolmentV3Id, steps, [
    { title: "Receive application" },
    { title: "Conduct interview", stepType: "approval" },
    { title: "Safeguarding review", stepType: "approval" },
    { title: "Confirm placement" },
    { title: "Collect documentation", evidenceRequired: true },
    { title: "Verify fee payment clearance" },
    { title: "Create student record in SIS" },
  ]);

  addPeople(enrolmentV3Id, people, [
    { userId: "user-gis-owner", role: "owner" },
    { userId: "user-gis-head", role: "approver" },
  ]);
  clonePeopleForVersion(enrolmentV1Id, enrolmentV2Id, people);
  clonePeopleForVersion(enrolmentV2Id, enrolmentV3Id, people);

  seedApproval({
    id: "approval-enrolment-v1-rejected",
    tenantId,
    entityType: "process_version",
    entityId: enrolmentV1Id,
    processId: "proc-gis-enrolment",
    status: "rejected",
    approverId: "user-gis-head",
    submittedBy: "user-gis-owner",
    submittedAt: "2026-05-20T11:00:00.000Z",
    decidedAt: "2026-05-21T10:00:00.000Z",
    comment: "Missing safeguarding step",
  });

  seedApproval({
    id: "approval-enrolment-v3-approved",
    tenantId,
    entityType: "process_version",
    entityId: enrolmentV3Id,
    processId: "proc-gis-enrolment",
    status: "approved",
    approverId: "user-gis-head",
    submittedBy: "user-gis-owner",
    submittedAt: "2026-05-25T10:00:00.000Z",
    decidedAt: enrolmentNow,
    comment: "Fee clearance and documentation controls added — approved.",
  });

  seedApproval({
    id: "approval-attendance-v2-approved",
    tenantId,
    entityType: "process_version",
    entityId: attendanceV2Id,
    processId: "proc-gis-attendance",
    status: "approved",
    approverId: "user-gis-head",
    submittedBy: "user-gis-owner",
    submittedAt: "2026-05-25T09:00:00.000Z",
    decidedAt: enrolmentNow,
    comment: "Parent notification step approved.",
  });

  seedApproval({
    id: "approval-hr-recruitment-pending",
    tenantId,
    entityType: "process_version",
    entityId: hrRecruitment.version.id,
    processId: hrRecruitment.process.id,
    status: "pending",
    approverId: "user-gis-head",
    submittedBy: "user-gis-compliance",
    submittedAt: "2026-05-27T08:00:00.000Z",
    comment: "Ready for department head review.",
  });

  return { processes, versions, steps, people, documents: new Map() };
}
