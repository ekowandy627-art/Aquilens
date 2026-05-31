import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requirePlatformUser();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const data = await aquilensInternalFetch<{ items: unknown[] }>(
    "/api/internal/guidance-packs",
  );

  return NextResponse.json({ items: data.items });
}
