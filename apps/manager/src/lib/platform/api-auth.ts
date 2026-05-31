import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type PlatformApiContext = {
  userId: string;
  role: "super_admin" | "support_staff";
};

export async function getPlatformContext(): Promise<PlatformApiContext | null> {
  const h = await headers();
  const userId = h.get("x-platform-user-id");
  const role = h.get("x-platform-user-role");

  if (!userId || (role !== "super_admin" && role !== "support_staff")) {
    return null;
  }

  return { userId, role };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requirePlatformUser() {
  const ctx = await getPlatformContext();
  if (!ctx) {
    return unauthorized();
  }
  return ctx;
}

export async function requireSuperAdmin() {
  const ctx = await requirePlatformUser();
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (ctx.role !== "super_admin") {
    return forbidden();
  }
  return ctx;
}
