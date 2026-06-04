import type { AuthUser } from "./auth.types";

export function withDemoAuthDefaults(
  user: Omit<AuthUser, "permissionGrants" | "assignedFunctionIds"> & {
    permissionGrants?: AuthUser["permissionGrants"];
    assignedFunctionIds?: string[];
  },
): AuthUser {
  return {
    ...user,
    permissionGrants: user.permissionGrants ?? [],
    assignedFunctionIds: user.assignedFunctionIds ?? [],
  };
}

const demoUsers: Record<string, AuthUser> = {
  "user-gis-admin": withDemoAuthDefaults({
    id: "user-gis-admin",
    tenantId: "tenant-gis",
    email: "gis-admin@aquilens.test",
    roles: ["Super Admin"],
    permissions: ["*"],
  }),
  "user-gis-compliance": withDemoAuthDefaults({
    id: "user-gis-compliance",
    tenantId: "tenant-gis",
    email: "gis-compliance@aquilens.test",
    roles: ["Compliance Officer"],
    permissions: [
      "processes:read",
      "workflows:read",
      "workflows:complete",
      "agents:read",
      "agents:create",
      "agents:edit",
      "audit:read",
      "audit_packs:generate",
      "standards:read",
      "standards:manage",
      "tenant_scaffold:read",
      "incidents:read",
      "incidents:create",
      "incidents:edit",
    ],
    permissionGrants: [
      { resource: "processes", action: "read", scope: "global" },
    ],
  }),
  "user-gis-head": withDemoAuthDefaults({
    id: "user-gis-head",
    tenantId: "tenant-gis",
    email: "gis-head@aquilens.test",
    roles: ["Department Head"],
    permissions: [
      "workflows:read",
      "workflows:complete",
      "agents:read",
      "agents:edit",
      "tenant_scaffold:read",
    ],
    permissionGrants: [
      { resource: "processes", action: "read", scope: "function" },
      { resource: "processes", action: "approve", scope: "function" },
    ],
    assignedFunctionIds: [
      "fn-school-academics",
      "fn-school-admissions",
      "fn-school-hr",
      "fn-school-finance",
    ],
  }),
  "user-gis-owner": withDemoAuthDefaults({
    id: "user-gis-owner",
    tenantId: "tenant-gis",
    email: "gis-owner@aquilens.test",
    roles: ["Process Owner"],
    permissions: [
      "processes:create",
      "processes:read",
      "processes:edit",
      "processes:publish",
      "standards:read",
      "standards:manage",
      "tenant_scaffold:read",
      "tenant_scaffold:manage",
      "workflows:read",
      "workflows:complete",
      "incidents:read",
      "incidents:create",
      "incidents:edit",
    ],
  }),
  "user-gis-staff": withDemoAuthDefaults({
    id: "user-gis-staff",
    tenantId: "tenant-gis",
    email: "gis-staff@aquilens.test",
    roles: ["Staff"],
    permissions: [
      "tenant_scaffold:read",
      "training:complete",
    ],
    permissionGrants: [
      { resource: "processes", action: "read", scope: "own" },
    ],
  }),
  "user-mfg-admin": withDemoAuthDefaults({
    id: "user-mfg-admin",
    tenantId: "tenant-mfg",
    email: "mfg-admin@aquilens.test",
    roles: ["Super Admin"],
    permissions: ["*"],
  }),
  "user-mfg-owner": withDemoAuthDefaults({
    id: "user-mfg-owner",
    tenantId: "tenant-mfg",
    email: "mfg-owner@aquilens.test",
    roles: ["Process Owner"],
    permissions: [
      "processes:create",
      "processes:read",
      "processes:edit",
      "processes:publish",
      "standards:read",
      "standards:manage",
      "tenant_scaffold:read",
      "tenant_scaffold:manage",
      "workflows:read",
      "workflows:complete",
    ],
  }),
  "user-mfg-compliance": withDemoAuthDefaults({
    id: "user-mfg-compliance",
    tenantId: "tenant-mfg",
    email: "mfg-compliance@aquilens.test",
    roles: ["Compliance Officer"],
    permissions: [
      "processes:read",
      "workflows:read",
      "audit:read",
      "audit_packs:generate",
      "standards:read",
      "standards:manage",
      "tenant_scaffold:read",
    ],
  }),
  "user-mfg-staff": withDemoAuthDefaults({
    id: "user-mfg-staff",
    tenantId: "tenant-mfg",
    email: "mfg-staff@aquilens.test",
    roles: ["Staff"],
    permissions: ["processes:read", "tenant_scaffold:read"],
    permissionGrants: [
      { resource: "processes", action: "read", scope: "own" },
    ],
  }),
  "user-hospital-admin": withDemoAuthDefaults({
    id: "user-hospital-admin",
    tenantId: "tenant-hospital",
    email: "hospital-admin@aquilens.test",
    roles: ["Super Admin"],
    permissions: ["*"],
  }),
  "user-hospital-staff": withDemoAuthDefaults({
    id: "user-hospital-staff",
    tenantId: "tenant-hospital",
    email: "hospital-staff@aquilens.test",
    roles: ["Staff"],
    permissions: [
      "processes:read",
      "training:complete",
    ],
  }),
  "user-gis-guest-auditor": withDemoAuthDefaults({
    id: "user-gis-guest-auditor",
    tenantId: "tenant-gis",
    email: "guest-auditor@aquilens.test",
    roles: ["Guest Auditor"],
    permissions: ["audit:read", "audit_packs:read", "processes:read"],
  }),
};

export function resolveDemoUser(token: string): AuthUser {
  if (!token.startsWith("demo:")) {
    throw new Error("Invalid demo token format.");
  }
  const userId = token.slice("demo:".length);
  const user = demoUsers[userId];
  if (!user) {
    throw new Error("Unknown demo user token.");
  }
  return user;
}

const demoUserProfiles: Record<
  string,
  { full_name: string; email: string; tenantId: string }
> = {
  "user-gis-admin": {
    full_name: "Sarah Mensah",
    email: "gis-admin@aquilens.test",
    tenantId: "tenant-gis",
  },
  "user-gis-compliance": {
    full_name: "James Asante",
    email: "gis-compliance@aquilens.test",
    tenantId: "tenant-gis",
  },
  "user-gis-head": {
    full_name: "Dr. Ama Boateng",
    email: "gis-head@aquilens.test",
    tenantId: "tenant-gis",
  },
  "user-gis-owner": {
    full_name: "Michael Darko",
    email: "gis-owner@aquilens.test",
    tenantId: "tenant-gis",
  },
  "user-gis-staff": {
    full_name: "Grace Osei",
    email: "gis-staff@aquilens.test",
    tenantId: "tenant-gis",
  },
  "user-mfg-admin": {
    full_name: "Akosua Mensah",
    email: "mfg-admin@aquilens.test",
    tenantId: "tenant-mfg",
  },
  "user-mfg-owner": {
    full_name: "Kwame Boateng",
    email: "mfg-owner@aquilens.test",
    tenantId: "tenant-mfg",
  },
  "user-mfg-compliance": {
    full_name: "Efua Asante",
    email: "mfg-compliance@aquilens.test",
    tenantId: "tenant-mfg",
  },
  "user-mfg-staff": {
    full_name: "Kofi Osei",
    email: "mfg-staff@aquilens.test",
    tenantId: "tenant-mfg",
  },
  "user-hospital-admin": {
    full_name: "Hospital Admin",
    email: "hospital-admin@aquilens.test",
    tenantId: "tenant-hospital",
  },
  "user-hospital-staff": {
    full_name: "Hospital Staff",
    email: "hospital-staff@aquilens.test",
    tenantId: "tenant-hospital",
  },
};

export function listDemoUsers(tenantId: string) {
  return Object.entries(demoUserProfiles)
    .filter(([, profile]) => profile.tenantId === tenantId)
    .map(([id, profile]) => ({
      id,
      full_name: profile.full_name,
      email: profile.email,
      status: "active",
    }));
}

export function getDemoUserProfile(userId: string) {
  const profile = demoUserProfiles[userId];
  if (!profile) {
    return null;
  }
  return { id: userId, ...profile };
}
