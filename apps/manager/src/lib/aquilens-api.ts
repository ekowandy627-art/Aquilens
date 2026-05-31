const apiBase =
  process.env.AQUILENS_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

function platformSecret() {
  return process.env.MANAGER_PLATFORM_SECRET?.trim() ?? "";
}

export async function aquilensInternalFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const secret = platformSecret();
  if (!secret) {
    throw new Error("MANAGER_PLATFORM_SECRET is not configured");
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = (await response.json()) as {
    success?: boolean;
    data?: T;
    error?: { message?: string };
  };

  if (!response.ok || body.success === false) {
    throw new Error(body.error?.message ?? `Aquilens API error (${response.status})`);
  }

  return body.data as T;
}

export async function lookupTenantBySlug(slug: string) {
  return aquilensInternalFetch<{
    tenantId: string;
    slug: string;
    name: string;
    status: "active" | "suspended";
    institutionType: string;
    country: string;
  }>(`/api/internal/tenant-lookup?slug=${encodeURIComponent(slug)}`);
}
