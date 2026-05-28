# Phase 14 — Standards Library & Tenant Selection

## Scope

- Six MVP guidance packs (global library, no tenant_id on packs)
- Tenant selections: `certified`, `working_towards`, `align`, `not_relevant`, `deferred`
- Rule-based recommendations from organisation type + country
- Department and process guidance links (demo store + API)
- Web: onboarding standards step, `/settings/standards`

## API routes

| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/v1/guidance/packs` | `standards:read` |
| GET | `/api/v1/guidance/packs/:slug` | `standards:read` |
| GET | `/api/v1/guidance/recommendations` | `standards:read` |
| GET | `/api/v1/tenants/me/guidance-selections` | `standards:read` |
| PUT | `/api/v1/tenants/me/guidance-selections` | `standards:manage` |
| PUT | `/api/v1/tenants/me/organisation-profile` | `standards:manage` |
| GET | `/api/v1/functions/:id/guidance` | `standards:read` |
| PUT | `/api/v1/functions/:id/guidance` | `tenant_scaffold:manage` |
| GET | `/api/v1/processes/:id/guidance` | `standards:read` |
| PUT | `/api/v1/processes/:id/guidance` | `processes:edit` |

## Local dev / E2E

Same as Phase 13 — API needs demo bearer when Supabase env is set:

```bash
ALLOW_DEMO_BEARER=true CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3010,http://localhost:3010 npm run dev:api
```

## Tests

- `apps/api/test/standards.test.ts` — P14-A-01 … P14-A-18
- `apps/api/test/guidance-recommendations.test.ts` — P14-U-01 … P14-U-04

## Content source

Pack summaries and requirement areas are seeded from `aquilens_standards_repository.md` (MVP six slugs). Full paid standard text is never stored.
