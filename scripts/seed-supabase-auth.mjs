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

async function main() {
  for (const tenant of tenants) {
    await upsertTenant(tenant);
  }

  for (const user of demoUsers) {
    const authUserId = await getOrCreateAuthUser(user);
    await upsertPublicUser(authUserId, user);
    console.log(`Seeded ${user.email}`);
  }

  console.log(`Done. Demo password: ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
