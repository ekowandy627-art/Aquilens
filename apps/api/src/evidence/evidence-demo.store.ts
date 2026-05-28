import { randomUUID } from "crypto";

export type WorkflowTaskEvidenceRecord = {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  workflowTaskId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
};

const evidence = new Map<string, WorkflowTaskEvidenceRecord>();

function buildInitialStore() {
  evidence.clear();

  seedEvidence({
    id: "evidence-enrol-t2-task2-pack",
    tenantId: "tenant-gis",
    workflowInstanceId: "workflow-gis-enrolment-t2",
    workflowTaskId: "workflow-gis-enrolment-t2-task-2",
    filename: "application_pack.pdf",
    fileType: "application/pdf",
    fileSize: 512_000,
    storagePath:
      "tenant-gis/evidence/workflow-gis-enrolment-t2-task-2/application_pack.pdf",
    checksum: "b4e6d9f0a2c3587e9012bcdef345678901234567890abcdef1234567890abcde",
    uploadedBy: "user-gis-head",
    uploadedAt: "2026-05-27T10:30:00.000Z",
    notes: "Interview notes and application pack",
  });

  seedEvidence({
    id: "evidence-enrol-t1-task3-docs",
    tenantId: "tenant-gis",
    workflowInstanceId: "workflow-gis-enrolment-t1",
    workflowTaskId: "workflow-gis-enrolment-t1-task-3",
    filename: "registration_documents.zip",
    fileType: "application/zip",
    fileSize: 1_024_000,
    storagePath:
      "tenant-gis/evidence/workflow-gis-enrolment-t1-task-3/registration_documents.zip",
    checksum: "c5f7e0a1b3d4698f0123cdef45678901234567890abcdef1234567890abcdef",
    uploadedBy: "user-gis-staff",
    uploadedAt: "2026-05-15T14:05:00.000Z",
  });

  seedEvidence({
    id: "evidence-incident-rca",
    tenantId: "tenant-gis",
    workflowInstanceId: "workflow-gis-safeguarding-oct",
    workflowTaskId: "workflow-gis-safeguarding-task-4",
    filename: "incident_rca_report.pdf",
    fileType: "application/pdf",
    fileSize: 384_000,
    storagePath:
      "tenant-gis/evidence/workflow-gis-safeguarding-task-4/incident_rca_report.pdf",
    checksum: "d6a8f1b2c4e5709a1234def5678901234567890abcdef1234567890abcdef12",
    uploadedBy: "user-gis-compliance",
    uploadedAt: "2026-05-18T12:05:00.000Z",
    notes: "Closed incident — data breach RCA",
  });
}

export function seedEvidence(record: WorkflowTaskEvidenceRecord) {
  evidence.set(record.id, record);
  return record.id;
}

buildInitialStore();

export class EvidenceDemoStore {
  create(input: Omit<WorkflowTaskEvidenceRecord, "id">) {
    const id = randomUUID();
    const row = { ...input, id };
    evidence.set(id, row);
    return row;
  }

  get(id: string) {
    return evidence.get(id) ?? null;
  }

  listForTask(workflowTaskId: string) {
    return [...evidence.values()]
      .filter((item) => item.workflowTaskId === workflowTaskId)
      .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
  }

  countForTask(workflowTaskId: string) {
    return this.listForTask(workflowTaskId).length;
  }
}

export const evidenceDemoStore = new EvidenceDemoStore();

export function resetEvidenceDemoStore() {
  buildInitialStore();
}
