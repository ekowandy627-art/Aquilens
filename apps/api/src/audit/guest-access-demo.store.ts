import { randomBytes, randomUUID } from "crypto";

export type GuestAccessRecord = {
  id: string;
  tenantId: string;
  scope: "function" | "process" | "date_range" | "incident";
  scopeId?: string;
  scopeLabel?: string;
  auditorEmail: string;
  token: string;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
  createdBy: string;
  createdAt: string;
};

function buildInitialGuestAccess(): GuestAccessRecord[] {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return [
    {
      id: "guest-cis-auditor",
      tenantId: "tenant-gis",
      scope: "function",
      scopeId: "fn-school-academics",
      scopeLabel: "Academics",
      auditorEmail: "auditor@cis.org",
      token: "guest-token-cis-auditor",
      expiresAt: expiresAt.toISOString(),
      status: "active",
      createdBy: "user-gis-admin",
      createdAt: "2026-05-20T10:00:00.000Z",
    },
  ];
}

let grants = buildInitialGuestAccess();

export class GuestAccessDemoStore {
  list(tenantId: string) {
    const now = new Date().toISOString();
    return grants
      .filter((grant) => grant.tenantId === tenantId)
      .map((grant) => ({
        ...grant,
        status:
          grant.status === "active" && grant.expiresAt < now
            ? ("expired" as const)
            : grant.status,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(tenantId: string, id: string) {
    return grants.find((grant) => grant.tenantId === tenantId && grant.id === id) ?? null;
  }

  getByToken(token: string) {
    const grant = grants.find((entry) => entry.token === token) ?? null;
    if (!grant) {
      return null;
    }
    const now = new Date().toISOString();
    if (grant.status === "revoked") {
      return { grant, error: "Access revoked" as const };
    }
    if (grant.expiresAt < now) {
      return { grant: { ...grant, status: "expired" as const }, error: "Access expired" as const };
    }
    return { grant, error: null };
  }

  create(input: {
    tenantId: string;
    scope: GuestAccessRecord["scope"];
    scopeId?: string;
    scopeLabel?: string;
    auditorEmail: string;
    expiresAt: string;
    createdBy: string;
  }) {
    const token = randomBytes(24).toString("hex");
    const grant: GuestAccessRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      scope: input.scope,
      scopeId: input.scopeId,
      scopeLabel: input.scopeLabel,
      auditorEmail: input.auditorEmail,
      token,
      expiresAt: input.expiresAt,
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    grants.unshift(grant);
    return grant;
  }

  revoke(tenantId: string, id: string) {
    const grant = this.get(tenantId, id);
    if (!grant) {
      return null;
    }
    grant.status = "revoked";
    return grant;
  }
}

export const guestAccessDemoStore = new GuestAccessDemoStore();

export function resetGuestAccessDemoStore() {
  grants = buildInitialGuestAccess();
}
