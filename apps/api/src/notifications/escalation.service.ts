import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { escalationDemoStore } from "./escalation-demo.store";
import { NotificationsService } from "./notifications.service";
import type { EscalationLevelInput, EscalationRuleRecord } from "./notification.types";

@Injectable()
export class EscalationService implements OnModuleInit {
  private intervalHandle?: NodeJS.Timeout;

  constructor(private readonly notifications: NotificationsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_ESCALATION_INTERVAL === "1") {
      return;
    }
    this.intervalHandle = setInterval(
      () => {
        void this.checkEscalations();
      },
      5 * 60 * 1000,
    );
    this.intervalHandle.unref();
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async list(user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.list(user.tenantId);
    }

    const { data: rules, error } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    return Promise.all(
      (rules ?? []).map((rule) => this.loadRuleWithLevels(rule, supabase)),
    );
  }

  async get(user: AuthUser, id: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.get(user.tenantId, id);
    }

    const { data, error } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    return this.loadRuleWithLevels(data, supabase);
  }

  async create(
    user: AuthUser,
    input: {
      name: string;
      triggerEvent: string;
      levels: EscalationLevelInput[];
    },
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.create(user.tenantId, user.id, input);
    }

    const ruleId = randomUUID();
    const now = new Date().toISOString();
    await supabase.from("escalation_rules").insert({
      id: ruleId,
      tenant_id: user.tenantId,
      name: input.name,
      trigger_event: input.triggerEvent,
      is_active: true,
      created_by: user.id,
      created_at: now,
    });

    await this.insertLevels(ruleId, input.levels, supabase);
    return this.get(user, ruleId);
  }

  async update(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      triggerEvent?: string;
      levels?: EscalationLevelInput[];
    },
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.update(user.tenantId, id, input);
    }

    const existing = await this.get(user, id);
    if (!existing) {
      return null;
    }

    await supabase
      .from("escalation_rules")
      .update({
        name: input.name ?? existing.name,
        trigger_event: input.triggerEvent ?? existing.triggerEvent,
      })
      .eq("tenant_id", user.tenantId)
      .eq("id", id);

    if (input.levels) {
      await supabase.from("escalation_rule_levels").delete().eq("rule_id", id);
      await this.insertLevels(id, input.levels, supabase);
    }

    return this.get(user, id);
  }

  async delete(user: AuthUser, id: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.delete(user.tenantId, id);
    }

    const { error } = await supabase
      .from("escalation_rules")
      .delete()
      .eq("tenant_id", user.tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  async toggle(user: AuthUser, id: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return escalationDemoStore.toggle(user.tenantId, id);
    }

    const existing = await this.get(user, id);
    if (!existing) {
      return null;
    }

    await supabase
      .from("escalation_rules")
      .update({ is_active: !existing.isActive })
      .eq("tenant_id", user.tenantId)
      .eq("id", id);

    return this.get(user, id);
  }

  async checkEscalations() {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return;
    }

    const { data: rules } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("is_active", true);

    for (const rule of rules ?? []) {
      await this.processRule(rule);
    }
  }

  resolveEscalationChain(
    rule: EscalationRuleRecord,
    elapsedHours: number,
  ) {
    const sorted = [...rule.levels].sort(
      (a, b) => a.levelNumber - b.levelNumber,
    );
    const fired: Array<{ levelNumber: number; targetRole: string }> = [];

    for (const level of sorted) {
      if (elapsedHours >= level.delayHours) {
        fired.push({
          levelNumber: level.levelNumber,
          targetRole: level.targetRole,
        });
      }
    }

    return fired;
  }

  private async processRule(rule: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[EscalationService] Active rule "${String(rule.name ?? rule.id)}" is configured but escalation processing is not implemented yet.`,
      );
    }
  }

  private async loadRuleWithLevels(
    rule: Record<string, unknown>,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ): Promise<EscalationRuleRecord> {
    const { data: levels } = await supabase
      .from("escalation_rule_levels")
      .select("*")
      .eq("rule_id", rule.id as string)
      .order("level_number");

    return {
      id: rule.id as string,
      tenantId: rule.tenant_id as string,
      name: rule.name as string,
      triggerEvent: rule.trigger_event as string,
      isActive: Boolean(rule.is_active),
      createdBy: (rule.created_by as string) ?? undefined,
      createdAt: rule.created_at as string,
      levels: (levels ?? []).map((level) => ({
        id: level.id as string,
        levelNumber: level.level_number as number,
        targetRole: level.target_role as string,
        delayHours: level.delay_hours as number,
      })),
    };
  }

  private async insertLevels(
    ruleId: string,
    levels: EscalationLevelInput[],
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    if (!levels.length) {
      return;
    }

    await supabase.from("escalation_rule_levels").insert(
      levels.map((level) => ({
        id: randomUUID(),
        rule_id: ruleId,
        level_number: level.levelNumber,
        target_role: level.targetRole,
        delay_hours: level.delayHours,
      })),
    );
  }
}
