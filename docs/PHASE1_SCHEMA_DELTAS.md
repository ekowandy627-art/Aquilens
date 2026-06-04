# Phase 1 schema deltas (Sprint 1)

Migration: `supabase/migrations/202606060001_phase1_jurisdictions.sql`

## Tenants

| Column | Type | Notes |
|--------|------|--------|
| `operating_jurisdictions` | `text[]` | Controlled taxonomy (`ghana`, `uk`, `eu`, …) |
| `output_market_jurisdictions` | `text[]` | Where products/services are sold |

Stored on tenant profile API (`PUT /api/v1/tenants/profile`) and mirrored in `organisation_profile` jsonb for pack recommendations.

## Processes

| Column | Type | Notes |
|--------|------|--------|
| `operating_jurisdictions` | `text[]` | Override when `jurisdictions_inherit_org = false` |
| `output_market_jurisdictions` | `text[]` | Override when `jurisdictions_inherit_org = false` |
| `jurisdictions_inherit_org` | `boolean` | Default `true` — inherit org jurisdictions |

## Shared taxonomy

`@aquilens/shared` exports `JURISDICTION_TAXONOMY`, `JURISDICTION_LABELS`, `normalizeJurisdictionList()`.

## Guidance selections (onboarding)

New selection status: `relevant` (include pack at onboarding). Posture statuses (`certified`, `align`, …) remain for settings / process link (Sprint 3+).
