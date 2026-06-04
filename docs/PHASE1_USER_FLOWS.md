# Phase 1 user flows (Product Spec)

Mirror of the implementation plan flow table. **S** = spec sprint.

## Flow 0 — Sign in (S1)

| Step | Route / API | Status |
|------|-------------|--------|
| Login | `/login`, demo bearer | OK |
| Scoped guard | `PermissionGuard` + `permissionGrants` | S1 NEW |
| Tenant bootstrap | `/onboarding` | OK |

## Flow 1 — Onboarding (S1)

| Step | FE | BE | Status |
|------|----|----|--------|
| Institution name, type, country | `/onboarding` step 0 | `PUT /tenants/profile` | OK |
| Operating + output-market jurisdictions | Multi-select taxonomy | `operating_jurisdictions`, `output_market_jurisdictions` | S1 NEW |
| Standards relevance only | `GuidanceSelectionPanel` `relevanceOnly` | `relevant` / `not_relevant` | S1 NEW |
| Scaffold review | Wizard steps 2–5 | scaffold save | OK |

## Flow 2 — Structure & settings (S1)

| Step | Route | Status |
|------|-------|--------|
| Function tree | `/settings/structure` | OK |
| Org profile + jurisdictions | `/settings/organisation` (via profile API) | S1 partial |
| Users / roles | `/settings/users`, `/settings/roles` | OK |

## Dual demo (S1)

| Tenant | Slug | Demo bearer examples |
|--------|------|----------------------|
| Ghana International School | `gis` | `demo:user-gis-owner` |
| Acme Foods Manufacturing | `mfg` | `demo:user-mfg-owner` |

`npm run seed:demo` resets GIS in-memory stores; manufacturing profile is available via demo bearer without Supabase.

## Later sprints (blocked until approved)

- Flow 3 — Composer (S3)
- Flow 4 — Control points + flow tab (S2)
- Flow 5–6 — Approval / training (S4–S6)
- Flow 7 — Incidents / SIAI (S5)
- Flow 8 — Resolution workflows only (S4)
- Flow 9–12 — Agents, dashboard, controls, audit (S7–S10)

See `PRODUCT_REVIEW_AND_SPEC.md` and `.cursor/plans/product_spec_implementation_5576650a.plan.md` for full acceptance criteria.
