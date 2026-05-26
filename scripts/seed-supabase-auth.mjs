#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error(
    "Run with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set. Example:\n" +
      "SUPABASE_URL=https://PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase-auth",
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const password = process.env.DEMO_USER_PASSWORD ?? "Aquilens2024!";

const tenants = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Ghana International School",
    slug: "gis",
    institution_type: "school",
    country: "Ghana",
    settings: { onboarding_complete: true },
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Demo Hospital",
    slug: "demo-hospital",
    institution_type: "hospital",
    country: "Ghana",
    settings: { onboarding_complete: false },
  },
];

const roleTemplates = [
  {
    key: "super-admin",
    name: "Super Admin",
    description: "Full access to everything in the tenant.",
    permissions: ["*"],
  },
  {
    key: "compliance-officer",
    name: "Compliance Officer",
    description: "Read-only tenant oversight and audit pack generation.",
    permissions: [
      "processes:read",
      "workflows:read",
      "agents:read",
      "audit:read",
      "audit_packs:generate",
    ],
  },
  {
    key: "department-head",
    name: "Department Head",
    description: "Function-scoped approval and workflow oversight.",
    permissions: ["processes:read", "processes:approve", "workflows:read"],
  },
  {
    key: "process-owner",
    name: "Process Owner",
    description: "Create, edit, and submit owned processes.",
    permissions: [
      "processes:create",
      "processes:read",
      "processes:edit",
      "workflows:read",
    ],
  },
  {
    key: "staff",
    name: "Staff",
    description: "Complete assigned tasks and view own process work.",
    permissions: ["processes:read", "workflows:complete"],
  },
];

const demoUsers = [
  {
    email: "gis-admin@aquilens.test",
    full_name: "Sarah Mensah",
    tenant_id: tenants[0].id,
    role: "Super Admin",
  },
  {
    email: "gis-compliance@aquilens.test",
    full_name: "James Asante",
    tenant_id: tenants[0].id,
    role: "Compliance Officer",
  },
  {
    email: "gis-head@aquilens.test",
    full_name: "Dr. Ama Boateng",
    tenant_id: tenants[0].id,
    role: "Department Head",
  },
  {
    email: "gis-owner@aquilens.test",
    full_name: "Michael Darko",
    tenant_id: tenants[0].id,
    role: "Process Owner",
  },
  {
    email: "gis-staff@aquilens.test",
    full_name: "Grace Osei",
    tenant_id: tenants[0].id,
    role: "Staff",
  },
  {
    email: "hospital-admin@aquilens.test",
    full_name: "Hospital Admin",
    tenant_id: tenants[1].id,
    role: "Super Admin",
  },
  {
    email: "hospital-staff@aquilens.test",
    full_name: "Hospital Staff",
    tenant_id: tenants[1].id,
    role: "Staff",
  },
  {
    email: "dual@aquilens.test",
    full_name: "Dual Tenant User",
    tenant_id: tenants[0].id,
    role: "Process Owner",
  },
];

function roleIdFor(tenantId, roleKey) {
  const suffix = tenantId.endsWith("1") ? "1" : "2";
  const roleIndex = roleTemplates.findIndex((role) => role.key === roleKey) + 1;
  return `10000000-0000-4000-800${suffix}-00000000000${roleIndex}`;
}

function roleKeyForName(roleName) {
  const template = roleTemplates.find((role) => role.name === roleName);
  if (!template) {
    throw new Error(`Unknown role: ${roleName}`);
  }
  return template.key;
}

async function upsertTenant(tenant) {
  const { error } = await supabase.from("tenants").upsert(tenant, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Tenant ${tenant.slug}: ${error.message}`);
  }
}

async function getOrCreateAuthUser(user) {
  const { data: existing, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    throw new Error(`List auth users: ${listError.message}`);
  }

  const found = existing.users.find(
    (candidate) => candidate.email?.toLowerCase() === user.email.toLowerCase(),
  );

  if (found) {
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        role: user.role,
      },
    });

    if (error) {
      throw new Error(`Update auth user ${user.email}: ${error.message}`);
    }

    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      tenant_id: user.tenant_id,
      role: user.role,
    },
  });

  if (error) {
    throw new Error(`Create auth user ${user.email}: ${error.message}`);
  }

  return data.user.id;
}

async function upsertPublicUser(authUserId, user) {
  const { error } = await supabase.from("users").upsert(
    {
      id: authUserId,
      tenant_id: user.tenant_id,
      full_name: user.full_name,
      email: user.email,
      status: "active",
      mfa_enabled: false,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Profile ${user.email}: ${error.message}`);
  }
}

async function upsertRolesForTenant(tenantId) {
  for (const role of roleTemplates) {
    const { error } = await supabase.from("roles").upsert(
      {
        id: roleIdFor(tenantId, role.key),
        tenant_id: tenantId,
        name: role.name,
        description: role.description,
        is_system: true,
        system_key: role.key,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(`Role ${role.name}: ${error.message}`);
    }
  }
}

async function assignRole(authUserId, user) {
  const roleId = roleIdFor(user.tenant_id, roleKeyForName(user.role));
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: authUserId,
      role_id: roleId,
      tenant_id: user.tenant_id,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "user_id,role_id,tenant_id" },
  );

  if (error) {
    throw new Error(`Assign ${user.role} to ${user.email}: ${error.message}`);
  }
}

async function main() {
  for (const tenant of tenants) {
    await upsertTenant(tenant);
    await upsertRolesForTenant(tenant.id);
  }

  for (const user of demoUsers) {
    const authUserId = await getOrCreateAuthUser(user);
    await upsertPublicUser(authUserId, user);
    await assignRole(authUserId, user);
    console.log(`Seeded ${user.email}`);
  }

  console.log(`Done. Demo password: ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
