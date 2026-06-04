import { getSupabaseAdminClient } from "../supabase/admin-client";

/** Demo/in-memory platform ops when Supabase is absent or in automated tests. */
export function usePlatformOpsDemoStore() {
  return !getSupabaseAdminClient() || process.env.NODE_ENV === "test";
}
