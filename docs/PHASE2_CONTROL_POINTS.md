# Phase 2 — Control points and evidence map (Sprint 2)

## Schema

| Column | Table | Type | Notes |
|--------|-------|------|-------|
| `is_control_point` | `process_steps` | `boolean` | Replaces bare `evidence_required` for UX |
| `evidence_map` | `process_steps` | `jsonb` | Mode + fields per control step |

Migration `202606070001_phase2_control_points.sql` backfills `evidence_required=true` steps to control points with `mode: acknowledgement` and `needsCompletion: true`.

## Evidence map modes

- `acknowledgement` — training / acknowledgement record (Sprint 6)
- `external_system` — requires `systemName`
- `physical` — requires `locationDescription`

Shared helpers: `packages/shared/src/control-points.ts`, API `apps/api/src/processes/control-points.ts`.

## API

- Step create/update: `isControlPoint`, `evidenceMap` (legacy `evidenceRequired` still accepted)
- Process detail: `lifecycle.spine` (derived stages), `evidenceMapComplete` on steps
- Process PATCH: `jurisdictionsInheritOrg`, `operatingJurisdictions`, `outputMarketJurisdictions`

## UI

- Step builder: control point toggle + evidence map fields
- Process detail: **Flow** tab (read-only), lifecycle spine above tabs
- Process editor: jurisdiction override in Governance step

## Tests

`apps/api/test/spec-sprint-2.test.ts` — `S2-CP-*`, `S2-JUR-01`, `S2-FLOW-01`.
