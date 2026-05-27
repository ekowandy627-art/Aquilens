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

const tenantScaffolds = {
  school: [
    ["Academics", ["Student Records", "Curriculum", "Assessment", "Timetabling"]],
    ["Admissions", ["Enquiries", "Enrolment", "Scholarships"]],
    ["Finance", ["Fees & Billing", "Payroll", "Procurement"]],
    ["HR", ["Recruitment", "Staff Records", "Performance"]],
    ["Operations", ["Facilities", "Health & Safety", "Transport"]],
    ["IT", ["Systems", "Data Management", "Helpdesk"]],
  ],
  hospital: [
    ["Clinical", ["Patient Admissions", "Wards", "Theatre", "Emergency"]],
    ["Pharmacy", ["Dispensing", "Procurement", "Controlled Drugs"]],
    ["Nursing", ["Ward Staffing", "Patient Handover", "Care Plans"]],
    ["Admissions", ["Registration", "Insurance Checks", "Discharge"]],
    ["Finance", ["Billing", "Payroll", "Procurement"]],
    ["IT", ["Systems", "Data", "Security"]],
  ],
};

const roleTemplates = [
  {
    key: "super-admin",
    name: "Super Admin",
    description: "Full access to everything in the tenant.",
    permissions: [
      "users:read",
      "users:invite",
      "users:edit",
      "users:assign_roles",
      "roles:manage",
      "settings:edit",
      "tenant_scaffold:read",
      "tenant_scaffold:manage",
      "access_reviews:read",
      "access_reviews:manage",
    ],
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
      "users:read",
      "tenant_scaffold:read",
      "access_reviews:read",
      "access_reviews:manage",
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

function splitPermission(permission) {
  if (permission === "*") {
    return null;
  }

  const [resource, action] = permission.split(":");
  return { resource, action };
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

    for (const permission of role.permissions) {
      const parsed = splitPermission(permission);

      if (!parsed) {
        continue;
      }

      const { data: permissionRow, error: permissionError } = await supabase
        .from("permissions")
        .select("id")
        .eq("resource", parsed.resource)
        .eq("action", parsed.action)
        .single();

      if (permissionError) {
        throw new Error(`Permission ${permission}: ${permissionError.message}`);
      }

      const { error: rolePermissionError } = await supabase
        .from("role_permissions")
        .upsert(
          {
            role_id: roleIdFor(tenantId, role.key),
            permission_id: permissionRow.id,
            scope: "global",
          },
          { onConflict: "role_id,permission_id,scope" },
        );

      if (rolePermissionError) {
        throw new Error(
          `Role permission ${role.name}/${permission}: ${rolePermissionError.message}`,
        );
      }
    }
  }
}

async function upsertScaffoldForTenant(tenant) {
  const scaffold = tenantScaffolds[tenant.institution_type] ?? tenantScaffolds.school;

  for (const [functionIndex, [functionName, areas]] of scaffold.entries()) {
    const functionId = deterministicId(tenant.id, `function-${functionIndex + 1}`);
    const { error: functionError } = await supabase.from("tenant_functions").upsert(
      {
        id: functionId,
        tenant_id: tenant.id,
        name: functionName,
        sort_order: functionIndex,
        status: "active",
      },
      { onConflict: "id" },
    );

    if (functionError) {
      throw new Error(`Function ${functionName}: ${functionError.message}`);
    }

    for (const [areaIndex, areaName] of areas.entries()) {
      const { error: areaError } = await supabase
        .from("tenant_process_areas")
        .upsert(
          {
            id: deterministicId(
              tenant.id,
              `function-${functionIndex + 1}-area-${areaIndex + 1}`,
            ),
            tenant_id: tenant.id,
            function_id: functionId,
            name: areaName,
            sort_order: areaIndex,
            status: "active",
          },
          { onConflict: "id" },
        );

      if (areaError) {
        throw new Error(`Process area ${areaName}: ${areaError.message}`);
      }
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

function processCode(functionName, areaName, sequence) {
  const func = functionName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  const areaWord = areaName.trim().split(/\s+/)[0] ?? areaName;
  const area = areaWord.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4).padEnd(3, "X").slice(0, 4);
  return `${func}-${area}-${String(sequence).padStart(3, "0")}`;
}

async function seedGisProcesses(tenantId, ownerUserId) {
  const seeds = [
    {
      id: "30000000-0000-4000-8001-000000000001",
      versionId: "30000000-0000-4000-8001-000000000101",
      functionKey: "function-1",
      areaKey: "function-1-area-1",
      name: "Record Student Attendance",
      status: "draft",
      versionStatus: "draft",
      riskRating: "medium",
      sequence: 1,
      reviewFrequency: "quarterly",
      executionSchedule: { kind: "daily", timezone: "Africa/Accra" },
      steps: [
        "Teacher takes register",
        "Discrepancies flagged to admin",
        "Absence notified to parents",
      ],
      people: [{ role: "owner" }, { role: "viewer", email: "gis-staff@aquilens.test" }],
    },
    {
      id: "30000000-0000-4000-8001-000000000002",
      versionId: "30000000-0000-4000-8001-000000000102",
      functionKey: "function-2",
      areaKey: "function-2-area-2",
      name: "Enrol New Student",
      status: "active",
      versionStatus: "active",
      riskRating: "high",
      sequence: 1,
      reviewFrequency: "annually",
      executionSchedule: { kind: "ad_hoc" },
      steps: [
        "Receive application",
        "Conduct interview",
        "Confirm placement",
        "Collect documentation",
        "Create student record in SIS",
      ],
    },
    {
      id: "30000000-0000-4000-8001-000000000003",
      versionId: "30000000-0000-4000-8001-000000000103",
      functionKey: "function-3",
      areaKey: "function-3-area-1",
      name: "Issue Fee Invoice",
      status: "draft",
      versionStatus: "draft",
      riskRating: "low",
      sequence: 1,
      reviewFrequency: "annually",
      executionSchedule: { kind: "monthly", dayOfMonth: 1, timezone: "Africa/Accra" },
      steps: [
        "Generate invoice from fee schedule",
        "Review invoice totals",
        "Send invoice to guardian",
      ],
    },
  ];

  const functionNames = {
    "function-1": "Academics",
    "function-2": "Admissions",
    "function-3": "Finance",
  };
  const areaNames = {
    "function-1-area-1": "Student Records",
    "function-2-area-2": "Enrolment",
    "function-3-area-1": "Fees & Billing",
  };

  for (const seed of seeds) {
    const functionId = deterministicId(tenantId, seed.functionKey);
    const processAreaId = deterministicId(tenantId, seed.areaKey);
    const code = processCode(
      functionNames[seed.functionKey],
      areaNames[seed.areaKey],
      seed.sequence,
    );

    const { error: processError } = await supabase.from("processes").upsert(
      {
        id: seed.id,
        tenant_id: tenantId,
        function_id: functionId,
        process_area_id: processAreaId,
        process_code: code,
        name: seed.name,
        purpose: seed.name,
        risk_rating: seed.riskRating,
        review_frequency: seed.reviewFrequency ?? "annually",
        execution_schedule: seed.executionSchedule ?? { kind: "ad_hoc" },
        status: seed.status,
        created_by: ownerUserId,
      },
      { onConflict: "id" },
    );

    if (processError) {
      throw new Error(`Process ${seed.name}: ${processError.message}`);
    }

    const { error: versionError } = await supabase.from("process_versions").upsert(
      {
        id: seed.versionId,
        tenant_id: tenantId,
        process_id: seed.id,
        version_number: 1,
        status: seed.versionStatus,
        created_by: ownerUserId,
      },
      { onConflict: "id" },
    );

    if (versionError) {
      throw new Error(`Process version ${seed.name}: ${versionError.message}`);
    }

    const { error: linkError } = await supabase
      .from("processes")
      .update({ current_version_id: seed.versionId })
      .eq("id", seed.id);

    if (linkError) {
      throw new Error(`Process version link ${seed.name}: ${linkError.message}`);
    }

    await supabase
      .from("process_steps")
      .delete()
      .eq("process_version_id", seed.versionId);

    for (const [index, title] of seed.steps.entries()) {
      const { error: stepError } = await supabase.from("process_steps").insert({
        tenant_id: tenantId,
        process_version_id: seed.versionId,
        step_number: index + 1,
        title,
        step_type: title.toLowerCase().includes("interview") ? "approval" : "manual",
        evidence_required: title.toLowerCase().includes("documentation"),
      });

      if (stepError) {
        throw new Error(`Process step ${title}: ${stepError.message}`);
      }
    }

    await supabase
      .from("process_version_people")
      .delete()
      .eq("process_version_id", seed.versionId);

    const peopleRows = [];

    if (seed.people?.length) {
      for (const person of seed.people) {
        let userId = ownerUserId;
        if (person.email) {
          const { data: userRow } = await supabase
            .from("users")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("email", person.email)
            .maybeSingle();
          userId = userRow?.id ?? ownerUserId;
        }
        peopleRows.push({
          process_version_id: seed.versionId,
          user_id: userId,
          role: person.role,
        });
      }
    } else {
      peopleRows.push({
        process_version_id: seed.versionId,
        user_id: ownerUserId,
        role: "owner",
      });
    }

    const { error: peopleError } = await supabase
      .from("process_version_people")
      .insert(peopleRows);

    if (peopleError) {
      throw new Error(`Process people ${seed.name}: ${peopleError.message}`);
    }
  }
}

async function main() {
  for (const tenant of tenants) {
    await upsertTenant(tenant);
    await upsertRolesForTenant(tenant.id);
    await upsertScaffoldForTenant(tenant);
  }

  let gisOwnerId = null;

  for (const user of demoUsers) {
    const authUserId = await getOrCreateAuthUser(user);
    await upsertPublicUser(authUserId, user);
    await assignRole(authUserId, user);
    if (user.email === "gis-owner@aquilens.test") {
      gisOwnerId = authUserId;
    }
    console.log(`Seeded ${user.email}`);
  }

  if (gisOwnerId) {
    await seedGisProcesses(tenants[0].id, gisOwnerId);
    console.log("Seeded GIS demo processes");
  }

  console.log(`Done. Demo password: ${password}`);
}

function deterministicId(tenantId, key) {
  const suffix = tenantId.endsWith("1") ? "1" : "2";
  const number = Number(key.replace(/\D/g, "").slice(0, 5)).toString().padStart(12, "0");
  return `20000000-0000-4000-800${suffix}-${number}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
