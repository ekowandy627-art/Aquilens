# Lessons Learned

## NestJS route handler must not share name with injected service

- **Mistake:** `WorkflowsController` injected `AuditService` as `private readonly audit` and defined a route method `audit()` — the property shadowed the method, causing `callback.apply is not a function` on `GET /workflows/:id/audit`.
- **Root cause:** Class field assignment overwrites prototype methods with the same name.
- **Prevention:** Never name injected services the same as handler methods; use `auditService` + `listWorkflowAudit()`.
- **Checks:** Grep controllers for `@Get` method names matching constructor parameter names; hit audit routes in integration tests.

## Demo store tests need reset between cases

- **Mistake:** Process/workflow tests interfered when run in one file without `beforeEach` reset.
- **Root cause:** In-memory singleton stores retain mutations across tests.
- **Prevention:** Export `resetProcessDemoStore()` / `resetWorkflowDemoStore()` and call in `beforeEach`.
- **Checks:** `beforeEach(() => { resetProcessDemoStore(); resetWorkflowDemoStore(); })` in API integration tests.

## useAuthContext must use a single React Context provider

- **Mistake:** `useAuthContext()` held `useState` per hook call — `AppShell` and `AuthGuard` had separate auth state; Playwright saw “Checking session…” indefinitely when one instance hung on Supabase.
- **Root cause:** No `AuthProvider`; duplicate effects; Supabase profile queries without timeout when `localStorage` was empty but env was configured.
- **Prevention:** One `AuthProvider` wrapping the app shell; `loadSession()` falls back to demo cookie; wrap Supabase fetches in `withTimeout`.
- **Checks:** Grep for `useState` inside `useAuthContext`; run `npm run test:e2e` with `ALLOW_DEMO_SESSION=true`.

## Supabase + demo E2E requires ALLOW_DEMO_BEARER and demo data routing

- **Mistake:** Playwright showed “Not found” on process detail while `curl` with `Bearer demo:…` returned 401 or Supabase-empty rows.
- **Root cause:** API used Supabase auth/data when env was set; demo bearer rejected; CORS blocked `:3010`; in-memory seed not queried for demo users.
- **Prevention:** `ALLOW_DEMO_BEARER=true` in `auth.guard.ts`; `getSupabaseForUser(user)` in process/approval services; default `CORS_ORIGINS` includes `:3010`; `POST /api/v1/demo/reset-gis` before serial P13 E2E.
- **Checks:** `ALLOW_DEMO_BEARER=true npm run dev:api`; `curl -H 'Authorization: Bearer demo:user-gis-owner' http://127.0.0.1:3001/api/v1/processes/proc-gis-fees`; Playwright `beforeAll` reset.

## Playwright demo cookie URL must match baseURL

- **Mistake:** `addCookies({ url: http://127.0.0.1:3000 })` while server ran on `:3010` — navigation used wrong port.
- **Root cause:** Hard-coded cookie URL; `playwright.ci.config.ts` did not read `PLAYWRIGHT_BASE_URL`.
- **Prevention:** Set `PLAYWRIGHT_BASE_URL` in CI config `use.baseURL` and cookie helper; use exact heading selectors when multiple h2 match.
- **Checks:** `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npx playwright test --config apps/web/playwright.ci.config.ts`

## npm test can hang if Nest apps do not close

- **Mistake:** `tsx --test` hung indefinitely after workflow tests.
- **Root cause:** Open handles from NestJS `app.init()` when tests fail mid-suite.
- **Prevention:** Always `await app.close()` in each test; use `node --test-force-exit --import tsx test/*.test.ts` when debugging hangs.
- **Checks:** `cd apps/api && node --test-force-exit --import tsx test/workflows.test.ts`
