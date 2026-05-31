import "server-only";

export type TenantPublicConfig = {
  tenantId: string;
  slug: string;
  name: string;
  status: "active" | "suspended";
  institutionType: string;
  country: string;
};

function normalizeManagerBase(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function lookupTenantFromManager(
  slug: string,
): Promise<TenantPublicConfig | null> {
  const base = normalizeManagerBase(process.env.MANAGER_LOOKUP_URL ?? "");
  const secret = process.env.MANAGER_LOOKUP_SECRET?.trim();

  if (!base || !secret) {
    return null;
  }

  const url = new URL("/api/internal/tenant-lookup", base);
  url.searchParams.set("slug", slug);

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TenantPublicConfig;
}

export function resolveTenantSlug(input?: string | null) {
  const fromQuery = input?.trim().toLowerCase();
  if (fromQuery) {
    return fromQuery;
  }

  const override = process.env.TENANT_SLUG_OVERRIDE?.trim().toLowerCase();
  if (override) {
    return override;
  }

  return "gis";
}
