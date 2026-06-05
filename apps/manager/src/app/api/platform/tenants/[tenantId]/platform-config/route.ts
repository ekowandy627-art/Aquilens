import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PlatformConfigPatch = {
  aiMonthlyBudgetUsd?: number | null;
  markupMultiplier?: number | null;
  lifecycleState?: "trial" | "active" | "suspended" | "offboarding";
  planLabel?: string;
  notes?: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantId: string }> },
) {
  const ctx = await requireSuperAdmin();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const { tenantId } = await context.params;
  const body = (await req.json().catch(() => null)) as PlatformConfigPatch | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body required" }, { status: 422 });
  }

  const patch: PlatformConfigPatch = {};

  if ("aiMonthlyBudgetUsd" in body) {
    if (body.aiMonthlyBudgetUsd === null) {
      patch.aiMonthlyBudgetUsd = null;
    } else if (typeof body.aiMonthlyBudgetUsd === "number") {
      if (!Number.isFinite(body.aiMonthlyBudgetUsd) || body.aiMonthlyBudgetUsd < 0) {
        return NextResponse.json(
          { error: "aiMonthlyBudgetUsd must be a non-negative number or null" },
          { status: 422 },
        );
      }
      patch.aiMonthlyBudgetUsd = body.aiMonthlyBudgetUsd;
    } else {
      return NextResponse.json(
        { error: "aiMonthlyBudgetUsd must be a number or null" },
        { status: 422 },
      );
    }
  }

  if ("markupMultiplier" in body) {
    if (body.markupMultiplier === null) {
      patch.markupMultiplier = null;
    } else if (
      typeof body.markupMultiplier === "number" &&
      Number.isFinite(body.markupMultiplier) &&
      body.markupMultiplier >= 0
    ) {
      patch.markupMultiplier = body.markupMultiplier;
    } else {
      return NextResponse.json(
        { error: "markupMultiplier must be a non-negative number or null" },
        { status: 422 },
      );
    }
  }

  if ("lifecycleState" in body) {
    const allowed = ["trial", "active", "suspended", "offboarding"] as const;
    if (!body.lifecycleState || !allowed.includes(body.lifecycleState)) {
      return NextResponse.json({ error: "Invalid lifecycleState" }, { status: 422 });
    }
    patch.lifecycleState = body.lifecycleState;
  }

  if ("planLabel" in body) {
    patch.planLabel = typeof body.planLabel === "string" ? body.planLabel : undefined;
  }

  if ("notes" in body) {
    patch.notes = typeof body.notes === "string" ? body.notes : undefined;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No supported fields to update" }, { status: 422 });
  }

  const result = await aquilensInternalFetch<Record<string, unknown>>(
    `/api/internal/tenants/${tenantId}/platform-config`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: actor } = await supabase
      .from("platform_users")
      .select("email")
      .eq("id", ctx.userId)
      .maybeSingle();

    await supabase.from("platform_audit_log").insert({
      actor_id: ctx.userId,
      actor_email: actor?.email ?? "platform@aquilens",
      event_type: "tenant.platform_config_updated",
      entity_type: "Tenant",
      entity_id: tenantId,
      entity_name: String(result.slug ?? tenantId),
      action: "Updated tenant platform configuration",
      metadata: patch,
    });
  }

  return NextResponse.json(result);
}
