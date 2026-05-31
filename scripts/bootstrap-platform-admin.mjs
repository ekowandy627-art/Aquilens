#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PLATFORM_JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const email = (process.env.PLATFORM_BOOTSTRAP_EMAIL ?? "platform-admin@aquilens.test")
  .trim()
  .toLowerCase();
const fullName = process.env.PLATFORM_BOOTSTRAP_NAME ?? "Aquilens Platform Admin";
const password =
  process.env.PLATFORM_BOOTSTRAP_PASSWORD ?? "AquilensPlatform2024!";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const passwordHash = await bcrypt.hash(password, 12);

const { data: existing } = await supabase
  .from("platform_users")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existing && process.env.PLATFORM_BOOTSTRAP_FORCE !== "1") {
  console.log(`Platform user already exists for ${email}. Set PLATFORM_BOOTSTRAP_FORCE=1 to add another.`);
  process.exit(0);
}

const { error } = await supabase.from("platform_users").insert({
  email,
  full_name: fullName,
  password_hash: passwordHash,
  role: "super_admin",
  status: "active",
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("Platform super admin created:");
console.log(`  email: ${email}`);
console.log(`  password: ${password}`);
