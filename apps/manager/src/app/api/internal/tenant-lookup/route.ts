import { NextResponse } from "next/server";
import { lookupTenantBySlug } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

/** LearnMotive-style lookup: tenant web resolves org config via manager, not tenant API. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const tenant = await lookupTenantBySlug(slug);
    return NextResponse.json({
      tenantId: tenant.tenantId,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      institutionType: tenant.institutionType,
      country: tenant.country,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
