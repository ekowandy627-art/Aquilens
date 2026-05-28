# Aquilens role and permission matrix

Maps **PRD roles** to **GIS demo roles** (Phase 1 seed) and **permissions introduced in Phases 12–19**.

Aquilens is **sector-agnostic** (`tenants.institution_type`: school, hospital, financial_services, ngo, corporate, government, other). Demo tenant GIS is a school example only.

## PRD role → GIS demo role

| PRD role | GIS demo role | Demo user |
|----------|---------------|-----------|
| Organisation administrator | Super Admin | `gis-admin@aquilens.test` |
| Compliance / governance lead | Compliance Officer | `gis-compliance@aquilens.test` |
| Department head | Department Head | `gis-head@aquilens.test` |
| Process / SOP owner | Process Owner | `gis-owner@aquilens.test` |
| Staff | Staff | `gis-staff@aquilens.test` |
| Internal auditor | Compliance Officer (MVP) | `gis-compliance@aquilens.test` |
| External auditor / guest | Guest access token (Phase 10) | Guest link — not a tenant RBAC role |
| Aquilens platform staff | *(out of tenant scope)* | Future staff portal |

## Phase 12 access notes

| Area | Super Admin | Compliance Officer | Dept Head | Process Owner | Staff |
|------|:-----------:|:------------------:|:---------:|:-------------:|:-----:|
| Operational dashboard (`/dashboard`) | Yes | Yes | Yes | Yes | My tasks only |
| Standards Alignment (`/alignment`) — Phase 16 | Yes | Yes | Yes | Yes | **No** |
| Audit packs (`/audit-packs`) | Yes | Yes | Scoped | Scoped | No |
| Guest read-only pack link | Issue | Issue | — | — | — |

## Future permissions (Phases 14–19)

| Resource | Actions | Typical roles |
|----------|---------|---------------|
| `standards` | read, manage | Admin, Compliance |
| `alignment` | read | Admin, Compliance, Dept Head, Process Owner, Auditor |
| `acknowledgements` | read, manage, complete (self) | All dept users / Staff complete |
| `internal_audits` | read, run, manage | Compliance, Admin |
| `findings` | read, create, edit, close | Compliance, Admin, owners |
| `corrective_actions` | read, create, edit, close | Compliance, Admin, owners |
| `evidence_packs` | read, export | Compliance, Admin |

## Institution profile storage

Align with existing tenant onboarding:

- `tenants.institution_type` — sector enum (not school-only)
- `tenants.country`
- `tenants.settings` jsonb — tenant preferences
- `organisation_profile` jsonb (Phase 14 migration) — extended profile for pack recommendations

Same pattern as Learn Motive’s per-tenant configuration, but Aquilens uses **one tenant row per organisation** rather than per-school schemas.
