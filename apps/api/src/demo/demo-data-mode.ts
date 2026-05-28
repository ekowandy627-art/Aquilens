import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient, hasSupabaseAdminEnv } from "../supabase/admin-client";

/** Demo seed users use stable ids such as `user-gis-owner`. */
export function isDemoSeedUser(user: AuthUser) {
  return user.id.startsWith("user-");
}

/**
 * When Supabase is configured but the caller authenticated with an explicit
 * demo bearer (`ALLOW_DEMO_BEARER=true`), serve reads/writes from in-memory
 * demo stores so Playwright and local UI match API unit tests.
 */
export function useInMemoryDemoData(user: AuthUser) {
  if (!hasSupabaseAdminEnv()) {
    return true;
  }
  return (
    process.env.ALLOW_DEMO_BEARER === "true" && isDemoSeedUser(user)
  );
}

export function getSupabaseForUser(user: AuthUser) {
  return useInMemoryDemoData(user) ? null : getSupabaseAdminClient();
}
