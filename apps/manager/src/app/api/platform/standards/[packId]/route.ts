import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ packId: string }> },
) {
  const ctx = await requireSuperAdmin();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const { packId } = await context.params;
  const body = (await req.json().catch(() => null)) as { isActive?: boolean };

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive required" }, { status: 422 });
  }

  const pack = await aquilensInternalFetch<Record<string, unknown>>(
    `/api/internal/guidance-packs/${packId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive: body.isActive }),
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
      event_type: "guidance_pack.updated",
      entity_type: "GuidancePack",
      entity_id: packId,
      entity_name: String(pack.name ?? packId),
      action: body.isActive ? "Activated guidance pack" : "Deactivated guidance pack",
      metadata: { isActive: body.isActive },
    });
  }

  return NextResponse.json(pack);
}
