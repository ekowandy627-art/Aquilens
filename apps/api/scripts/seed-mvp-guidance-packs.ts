/**
 * Idempotent upsert of MVP guidance packs into Supabase.
 * Run: npm run seed:mvp-guidance (from apps/api)
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { buildMvpGuidanceSeed } from "../src/standards/mvp-guidance-packs.seed";

/** Deterministic UUIDs for MVP pack rows (canonical_slug v1). */
const PACK_IDS: Record<string, { id: string; familyId: string }> = {
  "universal-sop-control": {
    id: "c1000001-0000-4000-8000-000000000001",
    familyId: "b1000001-0000-4000-8000-000000000001",
  },
  "iso-9001-quality": {
    id: "c1000001-0000-4000-8000-000000000002",
    familyId: "b1000001-0000-4000-8000-000000000002",
  },
  "school-operations": {
    id: "c1000001-0000-4000-8000-000000000003",
    familyId: "b1000001-0000-4000-8000-000000000003",
  },
  "health-and-care": {
    id: "c1000001-0000-4000-8000-000000000004",
    familyId: "b1000001-0000-4000-8000-000000000004",
  },
  "iso-27001-security": {
    id: "c1000001-0000-4000-8000-000000000005",
    familyId: "b1000001-0000-4000-8000-000000000005",
  },
  "iso-45001-hse": {
    id: "c1000001-0000-4000-8000-000000000006",
    familyId: "b1000001-0000-4000-8000-000000000006",
  },
};

function requirementId(packId: string, sortOrder: number): string {
  const suffix = String(sortOrder).padStart(12, "0");
  return `${packId.slice(0, 8)}-${packId.slice(9, 13)}-4000-8000-${suffix}`;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { packs, requirements } = buildMvpGuidanceSeed();
  let packsUpserted = 0;
  let requirementsUpserted = 0;

  for (const pack of packs) {
    const ids = PACK_IDS[pack.slug];
    if (!ids) {
      console.error(`Missing deterministic IDs for slug ${pack.slug}`);
      process.exit(1);
    }

    const row = {
      id: ids.id,
      slug: pack.slug,
      canonical_slug: pack.slug,
      family_id: ids.familyId,
      version: 1,
      name: pack.name,
      pack_type: pack.packType,
      sector: pack.sector,
      jurisdiction: pack.jurisdiction,
      version_label: pack.versionLabel,
      effective_date: pack.effectiveDate,
      disclaimer: pack.disclaimer,
      summary: pack.summary,
      is_active: true,
      status: "published",
      is_latest_published: true,
      published_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("guidance_packs").upsert(row, {
      onConflict: "canonical_slug,version",
    });

    if (error) {
      console.error(`Pack ${pack.slug}:`, error.message);
      process.exit(1);
    }
    packsUpserted += 1;
  }

  for (const req of requirements) {
    const packSlug = packs.find((p) => p.id === req.packId)?.slug;
    if (!packSlug) continue;

    const packId = PACK_IDS[packSlug]?.id;
    if (!packId) continue;

    const row = {
      id: requirementId(packId, req.sortOrder),
      pack_id: packId,
      requirement_area: req.requirementArea,
      reference_code: req.referenceCode ?? null,
      summary: req.summary,
      applies_to: req.appliesTo,
      suggested_sop_titles: req.suggestedSopTitles,
      required_controls: req.requiredControls,
      evidence_expected: req.evidenceExpected,
      risk_if_missing: req.riskIfMissing ?? null,
      audit_checks: req.auditChecks,
      sort_order: req.sortOrder,
    };

    const { error } = await supabase.from("guidance_requirements").upsert(row, {
      onConflict: "id",
    });

    if (error) {
      console.error(`Requirement ${req.requirementArea}:`, error.message);
      process.exit(1);
    }
    requirementsUpserted += 1;
  }

  console.log(
    `Seed complete: ${packsUpserted} packs, ${requirementsUpserted} requirements (idempotent upsert).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
