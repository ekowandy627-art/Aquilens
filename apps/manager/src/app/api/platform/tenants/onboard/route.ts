import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const onboardSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  institutionType: z.enum([
    "school",
    "hospital",
    "financial_services",
    "ngo",
    "corporate",
    "government",
    "other",
  ]),
  country: z.string().min(2),
  adminEmail: z.string().email(),
  adminFullName: z.string().min(2),
  adminPassword: z.string().min(8).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireSuperAdmin();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const parsed = onboardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboard payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const result = await aquilensInternalFetch<Record<string, unknown>>(
    "/api/internal/tenants/onboard",
    {
      method: "POST",
      body: JSON.stringify(parsed.data),
    },
  );

  const supabase = getSupabaseAdmin();
  if (supabase && ctx.userId) {
    const { data: actor } = await supabase
      .from("platform_users")
      .select("email")
      .eq("id", ctx.userId)
      .maybeSingle();

    await supabase.from("platform_audit_log").insert({
      actor_id: ctx.userId,
      actor_email: actor?.email ?? "platform@aquilens",
      event_type: "tenant.created",
      entity_type: "Tenant",
      entity_id: String(result.tenantId ?? ""),
      entity_name: parsed.data.name,
      action: `Onboarded tenant ${parsed.data.slug}`,
      metadata: { adminEmail: parsed.data.adminEmail },
    });
  }

  return NextResponse.json(result, { status: 201 });
}
