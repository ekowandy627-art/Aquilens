import assert from "node:assert/strict";
import { describe, it } from "node:test";

const supabaseUrl = process.env.SUPABASE_TEST_URL?.trim();

describe("db-integration (requires SUPABASE_TEST_URL)", { skip: !supabaseUrl }, () => {
  it("connects and sees manager control plane tables", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const key =
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY?.trim() ??
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    assert.ok(key, "SUPABASE_TEST_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY required");

    const client = createClient(supabaseUrl!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const tables = [
      "tenant_platform_config",
      "platform_ai_agents",
      "ai_usage_events",
      "standards_gap_analyses",
    ] as const;

    for (const table of tables) {
      const { error } = await client.from(table).select("*", { head: true, count: "exact" });
      assert.ok(!error, `${table}: ${error?.message}`);
    }
  });
});
