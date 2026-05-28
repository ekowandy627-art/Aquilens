"use client";

import { apiFetch } from "@/lib/api-client";

export type AuditEvent = {
  id: string;
  timestamp: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AuditListResponse = {
  items: AuditEvent[];
  nextCursor?: string;
  total: number;
};

export type AuditPackSummary = {
  id: string;
  scope: string;
  scopeId?: string;
  scopeLabel?: string;
  dateFrom?: string;
  dateTo?: string;
  status: "pending" | "ready" | "failed";
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
};

export type GuestAccessGrant = {
  id: string;
  scope: string;
  scopeId?: string;
  scopeLabel?: string;
  auditorEmail: string;
  expiresAt: string;
  status: string;
  createdAt: string;
};

export type AuditFilters = {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

function buildQuery(filters: AuditFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchAuditEvents(filters: AuditFilters = {}) {
  return apiFetch<AuditListResponse>(`/audit${buildQuery(filters)}`);
}

export async function fetchAuditPacks() {
  return apiFetch<AuditPackSummary[]>("/audit-packs");
}

export async function generateAuditPack(input: {
  scope: string;
  scopeId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return apiFetch<{ jobId: string; status: string }>("/audit-packs/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAuditPackStatus(jobId: string) {
  return apiFetch<AuditPackSummary>(`/audit-packs/${jobId}/status`);
}

export async function fetchAuditPackDownload(jobId: string) {
  return apiFetch<{ status: string; downloadUrl: string | null }>(
    `/audit-packs/${jobId}/download`,
  );
}

export async function fetchGuestAccessGrants() {
  return apiFetch<GuestAccessGrant[]>("/guest-access");
}

export async function createGuestAccess(input: {
  scope: string;
  scopeId?: string;
  expiresAt: string;
  auditorEmail: string;
}) {
  return apiFetch<{
    id: string;
    accessUrl: string;
    token: string;
    auditorEmail: string;
    expiresAt: string;
  }>("/guest-access", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function revokeGuestAccess(id: string) {
  return apiFetch<GuestAccessGrant>(`/guest-access/${id}`, {
    method: "DELETE",
  });
}

export async function downloadAuditCsv(filters: AuditFilters = {}) {
  const { loadSession } = await import("@/lib/demo-auth");
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");

  const supabase = createSupabaseBrowserClient();
  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  let token = data.session?.access_token ?? null;
  if (!token) {
    const demoSession = loadSession();
    if (demoSession) {
      token = `demo:${demoSession.userId}`;
    }
  }

  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/audit/export${buildQuery(filters)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    throw new Error("CSV export failed");
  }

  return response.blob();
}

export async function downloadAuditPackFile(jobId: string) {
  const { loadSession } = await import("@/lib/demo-auth");
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");

  const supabase = createSupabaseBrowserClient();
  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  let token = data.session?.access_token ?? null;
  if (!token) {
    const demoSession = loadSession();
    if (demoSession) {
      token = `demo:${demoSession.userId}`;
    }
  }

  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/audit-packs/${jobId}/file`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    throw new Error("PDF download failed");
  }

  return response.blob();
}

export const entityTypeOptions = [
  "All",
  "Process",
  "Workflow",
  "Agent",
  "User",
  "Incident",
] as const;
