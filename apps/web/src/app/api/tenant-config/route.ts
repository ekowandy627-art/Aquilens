import { NextResponse } from "next/server";
import {
  lookupTenantFromManager,
  resolveTenantSlug,
} from "@/lib/manager/tenant-lookup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = resolveTenantSlug(url.searchParams.get("slug"));

  const tenant = await lookupTenantFromManager(slug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}
