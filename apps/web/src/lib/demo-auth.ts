"use client";

export type DemoTenant = {
  id: string;
  name: string;
  slug: string;
  institutionType: string;
  country: string;
};

export type DemoRole = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
};

export type DemoUser = {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  status: "active" | "invited" | "deactivated";
  roles: string[];
  lastLoginAt?: string;
};

export type DemoSession = {
  userId: string;
  tenantId: string;
};

const SESSION_KEY = "aquilens.auth-session.v1";
export const DEMO_SESSION_COOKIE = "aquilens-demo-session";

export const demoTenants: DemoTenant[] = [
  {
    id: "tenant-gis",
    name: "Ghana International School",
    slug: "gis",
    institutionType: "school",
    country: "Ghana",
  },
  {
    id: "tenant-hospital",
    name: "Demo Hospital",
    slug: "demo-hospital",
    institutionType: "hospital",
    country: "Ghana",
  },
];

export const demoRoles: DemoRole[] = [
  {
    id: "role-gis-admin",
    tenantId: "tenant-gis",
    name: "Super Admin",
    description: "Full tenant access, including users, roles, and settings.",
    isSystem: true,
    permissions: ["*"],
  },
  {
    id: "role-gis-compliance",
    tenantId: "tenant-gis",
    name: "Compliance Officer",
    description: "Read-only tenant oversight and audit pack generation.",
    isSystem: true,
    permissions: ["processes:read", "workflows:read", "agents:read", "audit:read", "audit_packs:generate"],
  },
  {
    id: "role-gis-head",
    tenantId: "tenant-gis",
    name: "Department Head",
    description: "Function-scoped approval and workflow oversight.",
    isSystem: true,
    permissions: ["processes:read", "processes:approve", "workflows:read"],
  },
  {
    id: "role-gis-owner",
    tenantId: "tenant-gis",
    name: "Process Owner",
    description: "Create, edit, and submit owned processes.",
    isSystem: true,
    permissions: ["processes:create", "processes:read", "processes:edit", "workflows:read"],
  },
  {
    id: "role-gis-staff",
    tenantId: "tenant-gis",
    name: "Staff",
    description: "Complete assigned tasks and view own process work.",
    isSystem: true,
    permissions: ["processes:read", "workflows:complete"],
  },
  {
    id: "role-hospital-admin",
    tenantId: "tenant-hospital",
    name: "Super Admin",
    description: "Full tenant access for Demo Hospital.",
    isSystem: true,
    permissions: ["*"],
  },
  {
    id: "role-hospital-staff",
    tenantId: "tenant-hospital",
    name: "Staff",
    description: "Complete assigned hospital tasks.",
    isSystem: true,
    permissions: ["processes:read", "workflows:complete"],
  },
];

export const demoUsers: DemoUser[] = [
  {
    id: "user-gis-admin",
    tenantId: "tenant-gis",
    fullName: "Sarah Mensah",
    email: "gis-admin@aquilens.test",
    status: "active",
    roles: ["role-gis-admin"],
    lastLoginAt: "2026-05-26T08:30:00Z",
  },
  {
    id: "user-gis-compliance",
    tenantId: "tenant-gis",
    fullName: "James Asante",
    email: "gis-compliance@aquilens.test",
    status: "active",
    roles: ["role-gis-compliance"],
  },
  {
    id: "user-gis-head",
    tenantId: "tenant-gis",
    fullName: "Dr. Ama Boateng",
    email: "gis-head@aquilens.test",
    status: "active",
    roles: ["role-gis-head"],
  },
  {
    id: "user-gis-owner",
    tenantId: "tenant-gis",
    fullName: "Michael Darko",
    email: "gis-owner@aquilens.test",
    status: "active",
    roles: ["role-gis-owner"],
  },
  {
    id: "user-gis-staff",
    tenantId: "tenant-gis",
    fullName: "Grace Osei",
    email: "gis-staff@aquilens.test",
    status: "active",
    roles: ["role-gis-staff"],
  },
  {
    id: "user-hospital-admin",
    tenantId: "tenant-hospital",
    fullName: "Hospital Admin",
    email: "hospital-admin@aquilens.test",
    status: "active",
    roles: ["role-hospital-admin"],
  },
  {
    id: "user-hospital-staff",
    tenantId: "tenant-hospital",
    fullName: "Hospital Staff",
    email: "hospital-staff@aquilens.test",
    status: "active",
    roles: ["role-hospital-staff"],
  },
  {
    id: "user-dual-gis",
    tenantId: "tenant-gis",
    fullName: "Dual Tenant User",
    email: "dual@aquilens.test",
    status: "active",
    roles: ["role-gis-owner"],
  },
  {
    id: "user-dual-hospital",
    tenantId: "tenant-hospital",
    fullName: "Dual Tenant User",
    email: "dual@aquilens.test",
    status: "active",
    roles: ["role-hospital-staff"],
  },
];

export function loadSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SESSION_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as DemoSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function setDemoSessionCookie(session: DemoSession) {
  const encoded = encodeURIComponent(JSON.stringify(session));
  document.cookie = `${DEMO_SESSION_COOKIE}=${encoded}; path=/; max-age=604800; samesite=lax`;
}

function clearDemoSessionCookie() {
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function saveSession(session: DemoSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setDemoSessionCookie(session);
  window.dispatchEvent(new Event("aquilens-session-changed"));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  clearDemoSessionCookie();
  window.dispatchEvent(new Event("aquilens-session-changed"));
}

export function signInDemo(email: string, password: string) {
  if (password !== "Aquilens2024!") {
    return { error: "Invalid demo password." };
  }

  const user = demoUsers.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    return { error: "Demo user not found." };
  }

  saveSession({ userId: user.id, tenantId: user.tenantId });
  return { user };
}

export function getSessionContext(session: DemoSession | null = loadSession()) {
  const user = demoUsers.find(
    (candidate) =>
      candidate.id === session?.userId && candidate.tenantId === session.tenantId,
  );
  const tenant = demoTenants.find((candidate) => candidate.id === session?.tenantId);
  const roles = demoRoles.filter((role) => user?.roles.includes(role.id));
  const memberships = user
    ? demoUsers.filter((candidate) => candidate.email === user.email)
    : [];

  return {
    session,
    user,
    tenant,
    roles,
    memberships,
  };
}

export function switchTenant(tenantId: string) {
  const context = getSessionContext();
  const membership = demoUsers.find(
    (candidate) =>
      candidate.email === context.user?.email && candidate.tenantId === tenantId,
  );

  if (membership) {
    saveSession({ userId: membership.id, tenantId });
  }
}

export function rolesForTenant(tenantId: string) {
  return demoRoles.filter((role) => role.tenantId === tenantId);
}

export function usersForTenant(tenantId: string) {
  return demoUsers.filter((user) => user.tenantId === tenantId);
}
