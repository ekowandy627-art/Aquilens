import { randomUUID } from "crypto";
import type { EscalationLevelInput, EscalationRuleRecord } from "./notification.types";

const rules = new Map<string, EscalationRuleRecord>();

function buildInitialRules() {
  rules.clear();

  const rule1Id = "escalation-task-sla";
  rules.set(rule1Id, {
    id: rule1Id,
    tenantId: "tenant-gis",
    name: "Workflow Task SLA Breach",
    triggerEvent: "task_sla_missed",
    isActive: true,
    createdBy: "user-gis-admin",
    createdAt: "2026-05-20T10:00:00.000Z",
    levels: [
      {
        id: `${rule1Id}-level-1`,
        levelNumber: 1,
        targetRole: "Staff",
        delayHours: 0,
      },
      {
        id: `${rule1Id}-level-2`,
        levelNumber: 2,
        targetRole: "Department Head",
        delayHours: 24,
      },
    ],
  });

  const rule2Id = "escalation-attestation";
  rules.set(rule2Id, {
    id: rule2Id,
    tenantId: "tenant-gis",
    name: "Attestation Overdue",
    triggerEvent: "attestation_overdue",
    isActive: true,
    createdBy: "user-gis-admin",
    createdAt: "2026-05-20T10:00:00.000Z",
    levels: [
      {
        id: `${rule2Id}-level-1`,
        levelNumber: 1,
        targetRole: "Process Owner",
        delayHours: 0,
      },
      {
        id: `${rule2Id}-level-2`,
        levelNumber: 2,
        targetRole: "Super Admin",
        delayHours: 48,
      },
    ],
  });
}

buildInitialRules();

export class EscalationDemoStore {
  list(tenantId: string) {
    return [...rules.values()]
      .filter((rule) => rule.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get(tenantId: string, id: string) {
    const rule = rules.get(id);
    if (!rule || rule.tenantId !== tenantId) {
      return null;
    }
    return rule;
  }

  create(
    tenantId: string,
    createdBy: string,
    input: {
      name: string;
      triggerEvent: string;
      levels: EscalationLevelInput[];
    },
  ) {
    const id = randomUUID();
    const rule: EscalationRuleRecord = {
      id,
      tenantId,
      name: input.name,
      triggerEvent: input.triggerEvent,
      isActive: true,
      createdBy,
      createdAt: new Date().toISOString(),
      levels: input.levels.map((level) => ({
        id: randomUUID(),
        levelNumber: level.levelNumber,
        targetRole: level.targetRole,
        delayHours: level.delayHours,
      })),
    };
    rules.set(id, rule);
    return rule;
  }

  update(
    tenantId: string,
    id: string,
    input: {
      name?: string;
      triggerEvent?: string;
      levels?: EscalationLevelInput[];
    },
  ) {
    const existing = this.get(tenantId, id);
    if (!existing) {
      return null;
    }
    const updated: EscalationRuleRecord = {
      ...existing,
      name: input.name ?? existing.name,
      triggerEvent: input.triggerEvent ?? existing.triggerEvent,
      levels: input.levels
        ? input.levels.map((level) => ({
            id: randomUUID(),
            levelNumber: level.levelNumber,
            targetRole: level.targetRole,
            delayHours: level.delayHours,
          }))
        : existing.levels,
    };
    rules.set(id, updated);
    return updated;
  }

  delete(tenantId: string, id: string) {
    const existing = this.get(tenantId, id);
    if (!existing) {
      return false;
    }
    rules.delete(id);
    return true;
  }

  toggle(tenantId: string, id: string) {
    const existing = this.get(tenantId, id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, isActive: !existing.isActive };
    rules.set(id, updated);
    return updated;
  }

  activeRulesForTrigger(tenantId: string, triggerEvent: string) {
    return this.list(tenantId).filter(
      (rule) => rule.isActive && rule.triggerEvent === triggerEvent,
    );
  }
}

export const escalationDemoStore = new EscalationDemoStore();

export function resetEscalationDemoStore() {
  buildInitialRules();
}
