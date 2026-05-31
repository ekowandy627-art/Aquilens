import type { AuthUser } from "./auth.types";

const demoUsers: Record<string, AuthUser> = {
  "user-gis-admin": {
    id: "user-gis-admin",
    tenantId: "tenant-gis",
    email: "gis-admin@aquilens.test",
    roles: ["Super Admin"],
    permissions: ["*"],
  },
  "user-gis-compliance": {
    id: "user-gis-compliance",
    tenantId: "tenant-gis",
    email: "gis-compliance@aquilens.test",
    roles: ["Compliance Officer"],
    permissions: [
      "processes:read",
      "workflows:read",
      "agents:read",
      "agents:create",
      "agents:edit",
      "audit:read",
      "audit_packs:generate",
      "standards:read",
      "standards:manage",
      "tenant_scaffold:read",
      "acknowledgements:read",
    ],
  },
  "user-gis-head": {
    id: "user-gis-head",
    tenantId: "tenant-gis",
    email: "gis-head@aquilens.test",
    roles: ["Department Head"],
    permissions: [
      "processes:read",
      "processes:approve",
      "workflows:read",
      "agents:read",
      "agents:edit",
      "tenant_scaffold:read",
      "acknowledgements:read",
    ],
  },
  "user-gis-owner": {
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
      "acknowledgements:read",
      "acknowledgements:manage",
    ],
  },
  "user-gis-staff": {
    id: "user-gis-staff",
    tenantId: "tenant-gis",
    email: "gis-staff@aquilens.test",
    roles: ["Staff"],
    permissions: [
      "processes:read",
      "tenant_scaffold:read",
      "acknowledgements:complete",
    ],
  },
  "user-hospital-admin": {
    id: "user-hospital-admin",
    tenantId: "tenant-hospital",
    email: "hospital-admin@aquilens.test",
    roles: ["Super Admin"],
    permissions: ["*"],
  },
  "user-hospital-staff": {
    id: "user-hospital-staff",
    tenantId: "tenant-hospital",
    email: "hospital-staff@aquilens.test",
    roles: ["Staff"],
    permissions: [
      "processes:read",
      "acknowledgements:complete",
    ],
  },
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
