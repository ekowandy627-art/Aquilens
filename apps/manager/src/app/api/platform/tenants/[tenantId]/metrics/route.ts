import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/api-auth";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantId: string }> },
) {
  const ctx = await requirePlatformUser();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const { tenantId } = await context.params;
  const data = await aquilensInternalFetch<Record<string, unknown>>(
    `/api/internal/metrics/tenants/${tenantId}`,
  );

  return NextResponse.json(data);
}
