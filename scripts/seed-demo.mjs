#!/usr/bin/env node

/**
 * One-command GIS demo reset (Phase 11).
 *
 * With Supabase configured: wipes GIS tenant rows, re-runs auth/process seed.
 * Without Supabase: resets in-memory API demo stores (local demo mode).
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const hasSupabase =
  Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (hasSupabase) {
  console.log("Supabase detected — wiping GIS tenant and re-seeding…\n");
  run("node", ["scripts/wipe-gis-supabase.mjs"], process.env);
  run("node", ["scripts/seed-supabase-auth.mjs"], process.env);
  console.log("\nGIS Supabase demo seed complete.");
  console.log("Password for all demo users: Aquilens2024!");
} else {
  console.log("No Supabase env — resetting in-memory demo stores…\n");
  run("npx", ["tsx", "scripts/reset-demo-stores.ts"], process.env);
}
