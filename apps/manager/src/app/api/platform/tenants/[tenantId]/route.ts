import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantId: string }> },
) {
  const ctx = await requireSuperAdmin();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const { tenantId } = await context.params;
  const body = (await req.json().catch(() => null)) as {
    status?: "active" | "suspended";
  };

  if (body.status !== "active" && body.status !== "suspended") {
    return NextResponse.json({ error: "status required" }, { status: 422 });
  }

  const result = await aquilensInternalFetch<Record<string, unknown>>(
    `/api/internal/tenants/${tenantId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: body.status }),
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
      event_type: "tenant.status_changed",
      entity_type: "Tenant",
      entity_id: tenantId,
      entity_name: String(result.slug ?? tenantId),
      action: `Set tenant status to ${body.status}`,
      metadata: {},
    });
  }

  return NextResponse.json(result);
}
