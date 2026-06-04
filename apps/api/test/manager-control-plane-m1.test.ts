import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildMvpGuidanceSeed } from "../src/standards/mvp-guidance-packs.seed";

const REPO_ROOT = join(import.meta.dirname, "../../..");
const MIGRATION = join(
  REPO_ROOT,
  "supabase/migrations/202606100001_manager_control_plane.sql",
);

describe("M1 manager control plane migration", () => {
  it("migration file exists and defines core tables", () => {
    assert.ok(existsSync(MIGRATION), "manager control plane migration must exist");
    const sql = readFileSync(MIGRATION, "utf8");
    const required = [
      "tenant_platform_config",
      "platform_ai_agents",
      "platform_ai_agent_prompt_versions",
      "ai_usage_events",
      "platform_support_access_log",
      "guidance_pack_proposals",
      "tenant_offboarding_jobs",
      "standards_gap_analyses",
      "v_tenant_ai_usage_monthly",
      "v_platform_agent_usage",
      "v_platform_benchmarks",
    ];
    for (const fragment of required) {
      assert.match(sql, new RegExp(fragment), `missing ${fragment}`);
    }
  });

  it("migration expands platform role enum", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /library_curator/);
    assert.match(sql, /billing/);
    assert.match(sql, /support_staff.*support/s);
  });

  it("migration backfills tenant_platform_config", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /insert into public\.tenant_platform_config/);
    assert.match(sql, /on conflict \(tenant_id\) do nothing/);
  });

  it("migration adds relevant to selection_status", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /'relevant'/);
  });

  it("migration seeds platform AI agents", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /sop_generate/);
    assert.match(sql, /standards_gap_analysis/);
    assert.match(sql, /standards_update_watch/);
  });
});

describe("M1 MVP guidance seed", () => {
  it("buildMvpGuidanceSeed returns six published packs", () => {
    const { packs, requirements } = buildMvpGuidanceSeed();
    assert.equal(packs.length, 6);
    assert.ok(requirements.length >= 60);
    for (const pack of packs) {
      assert.ok(pack.isActive);
      assert.ok(pack.slug.length > 0);
    }
  });
});
