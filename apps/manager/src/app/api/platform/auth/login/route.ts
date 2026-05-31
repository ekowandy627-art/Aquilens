import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";
import { signPlatformAccessToken } from "@/lib/auth/platform-jwt";
import { SESSION_TIMEOUTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Platform auth requires Supabase configuration" },
      { status: 503 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { data: user } = await supabase
    .from("platform_users")
    .select("id, email, full_name, role, status, password_hash")
    .eq("email", email)
    .maybeSingle<{
      id: string;
      email: string;
      full_name: string;
      role: "super_admin" | "support_staff";
      status: string;
      password_hash: string;
    }>();

  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await supabase
    .from("platform_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  const accessToken = await signPlatformAccessToken({
    userId: user.id,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  });

  response.cookies.set("platform_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TIMEOUTS.accessToken,
    path: "/",
  });

  return response;
}
