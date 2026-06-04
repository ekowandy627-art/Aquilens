import { randomUUID } from "crypto";

export type TrainingMode = "acknowledge_only" | "assessed";

export type TrainingModuleRecord = {
  id: string;
  tenantId: string;
  title: string;
  processId?: string;
  mode: TrainingMode;
  status: "draft" | "published";
  questionBank: Array<{ id: string; prompt: string; options: string[]; answerIndex: number }>;
  passThreshold: number;
  drawCount: number;
};

export type TrainingAssignmentRecord = {
  id: string;
  tenantId: string;
  moduleId: string;
  userId: string;
  status: "pending" | "completed" | "failed";
  score?: number;
  attempts: number;
  dueDate?: string;
  completedAt?: string;
};

const modules = new Map<string, TrainingModuleRecord>();
const assignments = new Map<string, TrainingAssignmentRecord>();

const sampleQuestions = Array.from({ length: 12 }, (_, index) => ({
  id: `q-${index + 1}`,
  prompt: `Training question ${index + 1}?`,
  options: ["A", "B", "C", "D"],
  answerIndex: 0,
}));

function seed() {
  if (modules.size > 0) {
    return;
  }
  const moduleId = "training-gis-safeguarding";
  modules.set(moduleId, {
    id: moduleId,
    tenantId: "tenant-gis",
    title: "Safeguarding essentials",
    processId: "proc-gis-enrolment",
    mode: "assessed",
    status: "published",
    questionBank: sampleQuestions,
    passThreshold: 0.8,
    drawCount: 10,
  });
  assignments.set("assign-gis-staff-safeguarding", {
    id: "assign-gis-staff-safeguarding",
    tenantId: "tenant-gis",
    moduleId,
    userId: "user-gis-staff",
    status: "pending",
    attempts: 0,
    dueDate: "2026-12-31T00:00:00.000Z",
  });
  modules.set("training-gis-ack-only", {
    id: "training-gis-ack-only",
    tenantId: "tenant-gis",
    title: "Code of conduct read",
    mode: "acknowledge_only",
    status: "published",
    questionBank: [],
    passThreshold: 1,
    drawCount: 0,
  });
  assignments.set("assign-gis-staff-ack", {
    id: "assign-gis-staff-ack",
    tenantId: "tenant-gis",
    moduleId: "training-gis-ack-only",
    userId: "user-gis-staff",
    status: "pending",
    attempts: 0,
  });
}

seed();

export function resetTrainingDemoStore() {
  modules.clear();
  assignments.clear();
  seed();
}

export const trainingDemoStore = {
  listModules(tenantId: string) {
    return [...modules.values()].filter((row) => row.tenantId === tenantId);
  },

  getModule(tenantId: string, id: string) {
    const row = modules.get(id);
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return row;
  },

  listMyAssignments(tenantId: string, userId: string) {
    return [...assignments.values()].filter(
      (row) => row.tenantId === tenantId && row.userId === userId,
    );
  },

  listAssignmentsForTenant(tenantId: string) {
    return [...assignments.values()].filter((row) => row.tenantId === tenantId);
  },

  getAssignment(tenantId: string, id: string) {
    const row = assignments.get(id);
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return row;
  },

  publishModule(input: Omit<TrainingModuleRecord, "id" | "status">) {
    const id = randomUUID();
    const record: TrainingModuleRecord = { ...input, id, status: "published" };
    modules.set(id, record);
    return record;
  },

  completeAssignment(
    assignmentId: string,
    patch: Partial<Pick<TrainingAssignmentRecord, "status" | "score" | "attempts" | "completedAt">>,
  ) {
    const existing = assignments.get(assignmentId);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    assignments.set(assignmentId, updated);
    return updated;
  },
};
