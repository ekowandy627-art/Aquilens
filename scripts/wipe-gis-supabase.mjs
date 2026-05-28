#!/usr/bin/env node

/**
 * Deletes all rows for the GIS demo tenant from Supabase (public schema).
 * Auth users are preserved but passwords are reset by seed-supabase-auth.
 */

import { createClient } from "@supabase/supabase-js";

const GIS_TENANT_ID = "00000000-0000-4000-8000-000000000001";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/** Child tables first (approximate FK-safe order for GIS tenant). */
const TABLES = [
  "access_review_items",
  "access_reviews",
  "audit_log",
  "notifications",
  "workflow_task_evidence",
  "workflow_tasks",
  "workflow_instances",
  "process_step_agents",
  "process_steps",
  "process_version_people",
  "process_versions",
  "approvals",
  "processes",
  "agent_attestations",
  "agents",
  "audit_pack_jobs",
  "guest_access_grants",
  "escalation_rules",
  "user_roles",
  "users",
  "tenant_process_areas",
  "tenant_functions",
  "roles",
];

async function deleteForTenant(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("tenant_id", GIS_TENANT_ID);

  if (error) {
    // Some tables use tenant_id only on related rows — skip missing columns
    if (error.message.includes("column") && error.message.includes("tenant_id")) {
      return 0;
    }
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function deleteProcessScoped(table, column = "tenant_id") {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq(column, GIS_TENANT_ID);

  if (error) {
    if (error.code === "42P01") {
      return 0;
    }
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function main() {
  console.log(`Wiping GIS tenant data (${GIS_TENANT_ID})…`);

  let total = 0;
  for (const table of TABLES) {
    try {
      const removed = await deleteForTenant(table);
      if (removed > 0) {
        console.log(`  ${table}: ${removed} row(s) deleted`);
        total += removed;
      }
    } catch (error) {
      console.warn(`  ${table}: skipped (${error.message})`);
    }
  }

  // process_steps / versions may reference tenant via process_versions.tenant_id
  for (const table of ["process_steps", "process_version_people"]) {
    try {
      const removed = await deleteProcessScoped(table);
      if (removed > 0) {
        console.log(`  ${table}: ${removed} row(s) deleted`);
        total += removed;
      }
    } catch {
      // optional tables
    }
  }

  console.log(`GIS tenant wipe complete (${total} rows removed).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
