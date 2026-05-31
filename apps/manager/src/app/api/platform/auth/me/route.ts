import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requirePlatformUser } from "@/lib/platform/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requirePlatformUser();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ user: { id: ctx.userId, role: ctx.role } });
  }

  const { data } = await supabase
    .from("platform_users")
    .select("id, email, full_name, role")
    .eq("id", ctx.userId)
    .maybeSingle();

  return NextResponse.json({
    user: data
      ? {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
        }
      : { id: ctx.userId, role: ctx.role },
  });
}
