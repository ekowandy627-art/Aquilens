# Manager app specification

Aquilens Manager (`apps/manager`) is the platform control plane for tenant lifecycle, AI budgets, standards curation, support access, and operational metrics.

## Deployment

After applying database migrations:

```bash
supabase db push
cd apps/api && npm run seed:mvp-guidance
```

The MVP guidance seed loads published standards packs into Supabase so tenant apps can adopt them at launch. Re-running the seed is idempotent.

## Environment

| Variable | App | Purpose |
|----------|-----|---------|
| `MANAGER_PLATFORM_SECRET` | manager + api | Bearer secret for internal API calls |
| `AQUILENS_API_BASE_URL` | manager | Nest API base (e.g. `http://localhost:3001`) |
| `MANAGER_JWT_SECRET` | manager | Platform user session signing |
| `SUPABASE_URL` / service role | manager + api | Platform auth + data |
| `ALLOW_DEMO_BEARER` | api | Enable demo bearer in test/local only |

See `apps/manager/.env.example` and `apps/api/.env.example` for full lists.

## Architecture

- Manager UI never queries tenant content tables directly.
- All tenant metrics and mutations go through `apps/api` internal routes (`/api/internal/*`) via `aquilensInternalFetch`.
- Support access issues a Supabase magic link for the per-tenant `aquilens-support` read-only user.

## Navigation

| Route | Purpose |
|-------|---------|
| `/platform` | Dashboard |
| `/platform/tenants` | Tenant list, onboard, suspend |
| `/platform/agents` | Platform AI agent registry + MTD usage |
| `/platform/standards` | Guidance library |
| `/platform/ai-usage` | Cross-tenant AI spend |
| `/platform/audit` | Platform audit log |
| `/platform/benchmarks` | Aggregate benchmarks |

## RBAC

Platform roles: `super_admin`, `support`, `billing`, `library_curator`. Standards authoring requires `library_curator` or `super_admin`.

## Testing

```bash
cd apps/api && ALLOW_DEMO_BEARER=true NODE_ENV=test npm test
cd apps/manager && npm run build
cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npx playwright test e2e/standards-updates.spec.ts --config playwright.ci.config.ts
```

Optional DB connectivity (requires live Supabase test project):

```bash
SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_ROLE_KEY=... npm test -- test/db-integration.test.ts
```
