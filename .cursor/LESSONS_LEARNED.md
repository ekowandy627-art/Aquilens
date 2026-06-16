## Service-worker / offline behavior is not headless-testable when Serwist is disabled in dev

- **Mistake:** Expecting Playwright/dev-server runs to verify PWA SW activation, offline navigation fallback, and update-toast flow for Learn Motive PWA Parts 2A–2C.
- **Root cause:** `next.config.ts` sets `withSerwistInit({ disable: NODE_ENV==='development' })`, so `npm run dev` logs "Serwist is disabled" and never registers `/sw.js`; SW only exists in production builds.
- **Prevention:** For SW/offline/update e2e, run against `next build && next start` (point at the localhost DB, never prod), or rely on Lighthouse-CI in Part 6D. Treat 2A–2C runtime acceptance as MANUAL until a production-mode harness exists. Headless dev runs can still validate manifest JSON, branding-icon API, head links, and `/~offline` page render.
- **Checks:** `grep "Serwist is disabled" dev log`; `npm run build && ls -la public/sw.js && grep finance public/sw.js`; `curl /manifest.webmanifest`, `curl "/api/school/branding/icons?size=192"`, `curl /~offline`.

## Lighthouse 12 removed the PWA category — pin @lhci/cli 0.13 for Part 6D gate

- **Mistake:** Using `@lhci/cli` 0.14 (Lighthouse 12) with `onlyCategories: ['pwa']` and `categories:pwa` assertions for Learn Motive PWA Part 6D.
- **Root cause:** Lighthouse 12.0 removed the PWA category and standalone `service-worker` audit; `installable-manifest` now covers manifest + SW installability in LH11 only.
- **Prevention:** Pin `@lhci/cli@^0.13.0` (bundles Lighthouse 11.4) for PWA ≥ 90 CI until the plan is updated for LH12+ DevTools-only installability checks. Assert `categories:pwa` + `installable-manifest`; do not assert removed `service-worker` audit id.
- **Checks:** `node -e "console.log(require('lighthouse/package.json').version)"` → 11.x; `npm run test:pwa:lighthouse` exit 0; `.lighthouseci/*.json` has `categories.pwa.score >= 0.9`.

## Self-service API routes need middleware universal allowlist when matrix omits the resource

- **Mistake:** Staff Attendance self endpoints (`/api/staff-attendance/check-in`, `/me`, `/me/today`) were RBAC-gated via `staff_attendance` matrix; teachers have empty `staff_attendance` perms → 403 before handlers ran.
- **Root cause:** Middleware applies route-manifest permissions to all `/api/*` unless listed in `isUniversalAuthApi()`; handlers already enforce own-staff-only but middleware blocked first.
- **Prevention:** For any self-service flow where handlers enforce scope, add paths to `isUniversalAuthApi()` (same pattern as `/api/staff/me`, `/api/teacher-audits/reports/my`). Add UI paths to middleware `matcher` for JWT auth without page-level matrix if self-service.
- **Checks:** Grep `staff_attendance: perms({})` roles vs routes they must call; verify teacher role can POST check-in without matrix `create` on `staff_attendance`.


- **Mistake:** Demo users kept `processes:read` in flat `permissions` while also defining `permissionGrants` with `function`/`own` scope — `resolveGrantScope` treated them as global and scope filtering never applied.
- **Root cause:** Flat permission keys imply global scope when no scoped grants exist; duplicate keys bypass function/own enforcement.
- **Prevention:** For scoped roles, put capabilities only in `permissionGrants`; use `hasPermissionGrant()` in services (audit, approvals) instead of `permissions.includes()`.
- **Checks:** `apps/api/test/spec-sprint-1.test.ts`; grep `permissions.includes("processes:`)` alongside scoped demo users.

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

## Strategic tasks need issueKey dedupe at Task and DraftTask layers

- **Mistake:** `createApprovalTasks()` always called `task.create` + `strategicDraftTask.create`, flooding `/tasks` with 99+ duplicates per department run even though `StrategicIssueRegister` already deduped via `issueKey`.
- **Root cause:** Register dedupe was not wired to task creation; zero-assessment deterministic actions and agent recommendations both blind-created rows.
- **Prevention:** Add `issueKey`, `lastSeenAt`, `sourceRunId` on `Task`; `issueKey` on `StrategicDraftTask`; implement `createOrBumpTask` / `createOrBumpDraftTask` (one open task per `issueKey`, bump priority/assignees/notes on reappear). Cleanup script must join via `strategic_draft_tasks` — never delete by `schoolId` alone.
- **Checks:** `npx vitest run src/test/unit/strategic-task-dedupe.test.ts`; dry-run `npx tsx scripts/cleanup-strategic-tasks.ts --school-id <uuid>` before `--execute`.

## Prisma enum migrations on multi-schema Neon DBs

- **Mistake:** Bare `ALTER TYPE ... ADD VALUE` against `public` search_path fails with 42704 when the enum lives only in tenant schemas (e.g. `srfs`).
- **Root cause:** `notification_v1` and similar migrations may skip creating enums in `public` when they already exist in tenant schemas.
- **Prevention:** Loop `pg_namespace` / `pg_type` for each schema holding the enum; use `ADD COLUMN IF NOT EXISTS` for new columns. Follow `prisma/migrations/20260606120000_teacher_audits/migration.sql` pattern for enum values.
- **Checks:** `npx prisma migrate deploy` on staging; grep migration SQL for `FOR r IN SELECT n.nspname`.

## FeeStructureItem source FK requires orphan cleanup before enforce

- **Mistake:** Phase A migration added `fee_structure_items_source_term_fee_line_item_id_fkey` immediately; deploy failed with 23503 when backfilled `source_term_fee_line_item_id` pointed at deleted `term_fee_line_items` rows.
- **Root cause:** Source-identity backfill or prior sync can leave stale UUIDs after term-fee line delete-recreate on matrix PUT.
- **Prevention:** Before adding the FK in migrations, `UPDATE fee_structure_items SET source_term_fee_line_item_id = NULL` where the referenced line id is missing. Re-run `backfill-fee-structure-item-source-identity.ts` after deploy if orphans were cleared.
- **Checks:** `npx prisma migrate deploy` succeeds; `SELECT COUNT(*) FROM fee_structure_items f LEFT JOIN term_fee_line_items li ON li.id = f.source_term_fee_line_item_id WHERE f.source_term_fee_line_item_id IS NOT NULL AND li.id IS NULL` → 0.

## Date-only validation must reject JS Date roll-over

- **Mistake:** `parseDateOnly = new Date(`${value}T00:00:00.000Z`)` accepted impossible calendar dates: "2026-02-30" normalized to 2026-03-02 and "2026-02-29" to 2026-03-01, so an "invalid → 422" acceptance criterion (AC-RUN-3) silently passed with a shifted date.
- **Root cause:** The JS `Date` constructor rolls overflowing day/month values forward instead of returning `Invalid Date`; `Number.isNaN(d.getTime())` only catches malformed strings, not normalized ones.
- **Prevention:** Validate the literal first (`/^\d{4}-\d{2}-\d{2}$/`), construct the Date, then assert round-trip equality `d.toISOString().slice(0,10) === value`; reject otherwise. Make this strict parser the single source of truth for both validation and persistence so the stored value equals the validated one.
- **Checks:** DB-independent unit test over `['2026-02-30','2026-02-29','2026-13-01','2026-2-1','not-a-date']` → all null/invalid, plus a valid date that round-trips.

## Phase-scoped rollups: only persist states reachable in the current phase

- **Mistake:** A tester finding demanded `ReportRun.status` roll up to `in_progress/ready/partially_published/closed`, but `partially_published`/`closed` depend on guardian publish (a later phase) while only readiness-driven `in_progress`/`ready` are reachable in the readiness phase.
- **Root cause:** Acceptance-criteria status maps span multiple phases; treating the whole map as one phase's obligation causes either scope creep or under-implementation.
- **Prevention:** When implementing a status rollup, scope it to the states actually reachable in the current phase and explicitly defer publish/recall-driven transitions to their owning phase. Compute rollups over in-scope (selected) rows only; exclude audit-excluded rows.
- **Checks:** Cross-reference each status value against the phase that produces its precondition (e.g. §16 AC tables vs §14 phase list) before requiring it.

## A single transform/compile error in a test file zeros out the whole suite

- **Mistake:** A duplicate `const { PrismaClient } = await import('@prisma/client')` in the same `it()` block (and a dead `const enrolmentByStudentId` Map) caused TS2451/TS6133; esbuild failed to transform `phase-reports-runs.test.ts`, so 0 of its 13+ tests ran and the failure looked like a logic regression.
- **Root cause:** Block-scoped `const` cannot be redeclared in the same lexical scope; under `noUnusedLocals`, unused locals also break `tsc`. Both are file-level transform errors, not per-test failures, so they silently disable every test in the file.
- **Prevention:** When reusing a dynamically-imported class (e.g. `PrismaClient`) twice in one block, import once and instantiate again (`new PrismaClient()`); never re-destructure. Run `tsc --noEmit` before vitest and treat any TS2451/TS6133 in a touched file as a hard test-suite blocker.
- **Checks:** `npx tsc --noEmit 2>&1 | grep -E '<changed-file>'` (must be clean) then `npx vitest run <file>` (suite must transform and execute, not report 0 tests).

## GET/PATCH report endpoints must forward reportRunId to the builder for mid-term context

- **Mistake:** `reports.[id].ts` GET and PATCH handlers call `buildTermReportPayload` with only `{ schoolId, studentId, termId }`, omitting `reportRunId`. For mid-term TermReports, the builder resolves `isMidTerm=false` (no run context), falls back to full-term `TermSubjectResult`, and returns empty subjects when no TermSubjectResult rows exist — causing AC-MID-3 and AC-MID-4 tests to throw TypeError.
- **Root cause:** Builder was extended to accept `reportRunId` for mid-term window resolution, but the GET/PATCH handlers that already existed were not updated to pass `row.reportRunId` (available on the `TermReport` row from Phase 2's schema addition).
- **Prevention:** Whenever a builder/service gains a new context parameter tied to a stored model field, immediately audit every call site that reads that model and passes data to the builder, and update each one.
- **Checks:** `grep -n "buildTermReportPayload" src/modules/academics/api/` — every call site must include `reportRunId: row.reportRunId` (or equivalent) when the TermReport row is the source.

## A readiness recompute on every GET silently overwrites persisted post-action state

- **Mistake:** `refreshRunClassReadiness()` runs on every `getReportRunWithClasses()` (i.e. each GET) and writes `ReportRunClass.status` from `computeClassReadiness()`, which only returns `not_started`/`blocked`/`ready_for_generate`. After the class-level generate endpoint set `status=data_generated`, the very next GET would reset it back to `ready_for_generate`, losing the generated marker in the UI/roll-up.
- **Root cause:** The recompute treats readiness as the sole source of truth and is unaware of action-driven persisted state (`generatedAt`). Recompute-on-read overwrites any status a mutation just wrote.
- **Prevention:** When a recompute-on-read function persists status, make it account for action markers: if blockers are cleared (`ready_for_generate`) AND `generatedAt` is set, keep `data_generated`/amber; only drop to Red when blockers genuinely reappear (stale detection). Persist and roll up the EFFECTIVE status, not the raw readiness status, so the rollup stays consistent.
- **Checks:** After a generate call, GET the run twice and assert the class stays `data_generated` (not reset to `ready_for_generate`); assert a blocked class generate creates zero `TermReport` rows and stays Red (TC-GEN-01/02).

## Reuse single-record generation logic via a shared lib, not duplicated route bodies

- **Mistake risk:** Implementing a bulk/class-level generate by copy-pasting the single-student build+upsert+audit body from `reports.generate.ts` would duplicate ~100 lines and invite L80-style call-site drift (e.g. forgetting to forward `reportRunId`).
- **Prevention:** Extract the per-record logic into a shared lib (`generateStudentTermReport()` in `report-generate.ts`) that throws stable error messages (`'Term not found'`/`'No active assessment configuration'`/`'Student not found'`); have both the single-student route and the bulk route call it and map those messages to 404/409. Keep HTTP/date-range resolution in the routes, business logic in `src/modules/academics/`.
- **Checks:** `grep -n "buildTermReportPayload\|generateStudentTermReport" src/modules/academics/` — generation should flow through the shared helper; `npx tsc --noEmit` clean for changed files.

## Background-job side-effect recipients must be persisted, not held in an in-memory map

- **Mistake:** `report-pdf-jobs.ts` stored the PDF-job requester only in a module-level `jobRequesterById` Map; the `ReportPdfJob` row persisted status/error but not the requester. After a process restart / hot reload / serverless instance change, the Map was empty, so the failure branch (`if (requester) { notify }`) silently skipped the AC-PDF-2 failure notification even though `status=failed` + `error` were saved.
- **Root cause:** Durable state (who to notify on completion/failure) lived only in volatile process memory, decoupled from the persisted job row that outlives the process.
- **Prevention:** Persist any data a background worker needs for its side effects (notification recipient, audit actor) on the job row itself (e.g. `requestedBy` column + optional FK). Derive recipients in BOTH success and failure paths from the row (`job.requestedBy ?? run.openedBy`); in the catch/failure branch re-read those fields from the DB when the job wasn't loaded yet, so notifications always fire after restart. Remove the in-memory map.
- **Checks:** `grep -rn "new Map(" src/modules/**/lib/*job*` for request-scoped maps; confirm enqueue writes the field and the worker reads it; assert a job that fails after a simulated restart still creates a failure notification (TC-PDF-03).

## A persisted status rollup must implement every reachable enum state, not just the easy ones

- **Mistake:** `refreshRunClassReadiness()` persisted `not_started`/`blocked`/`ready_for_generate`/`data_generated`/`published`/`partially_published` but never `ready_for_guardian` (Green). A generated class with all guardian-publish prerequisites met stayed `data_generated`/Amber, so the run rollup fell through to `in_progress` instead of `ready` — silently violating AC-STAT-1 even though `publish-guardian` would have accepted the same class.
- **Root cause:** The recompute treated "blockers cleared + generated" as the terminal pre-publish state and never evaluated the richer §9.1 Ready gate (teacher remarks, headmaster remarks) that distinguishes Amber from Green.
- **Prevention:** When a recompute persists a status enum that participates in a rollup, enumerate every enum value the spec table assigns and implement the predicate for each. For the Green/Ready state, reuse the SAME gate predicate the publish action enforces so the indicator is truthful (Green iff publish would pass). Extract the gate into one shared helper (`evaluateClassPublishReadyGate`) imported by both the recompute and the publish route — never duplicate the rule.
- **Checks:** After generate + filling teacher/headmaster remarks, GET the run and assert the class is `ready_for_guardian`/green and the run is `ready`; remove one remark and assert it drops back to `data_generated`/amber. Cross-reference each §16.2 traffic-light row against the recompute branches.

## Recall approval must restore draft state and recompute run readiness

- **Mistake:** Recall approval cleared snapshot/published fields but left `TermReport.status='recalled'` and did not trigger `refreshRunClassReadiness()`, so class/run traffic-light rollups could stay stale after recall.
- **Root cause:** Recall action updated only the report row without running the same readiness recompute path used by generate/publish mutations.
- **Prevention:** On recall approve, set report status back to `draft`, clear recall-request fields, and call `refreshRunClassReadiness()` for `row.reportRunId` (when present) immediately after the update.
- **Checks:** Approve recall for a previously published student and verify: report becomes `draft` with `snapshot=null` + no `publishedAt`; class moves Blue→Purple/Amber per AC-STAT-2; run rollup updates on the same request.

## npm test can hang if Nest apps do not close

- **Mistake:** `tsx --test` hung indefinitely after workflow tests.
- **Root cause:** Open handles from NestJS `app.init()` when tests fail mid-suite.
- **Prevention:** Always `await app.close()` in each test; use `node --test-force-exit --import tsx test/*.test.ts` when debugging hangs.
- **Checks:** `cd apps/api && node --test-force-exit --import tsx test/workflows.test.ts`

## HTML email templates must escape all user-controlled strings

- **Mistake risk:** `buildPwaSetupEmailHtml` interpolates `recipientName`, `schoolName`, and `logoUrl` directly into an HTML string. A school name with `<` or a `logoUrl` with `"` will malform or inject content into the email.
- **Root cause:** Template literals produce HTML without escaping; only safe for fully trusted static strings.
- **Prevention:** Always apply a minimal `escapeHtml(s)` utility (replace `&<>"'` with entities) to any value sourced from the database or user input before inserting into an HTML string template.
- **Checks:** Unit test `buildPwaSetupEmailHtml` with a school name like `"St Mary's & Sons <Primary>"` and assert the output contains `&amp;`, `&lt;`, etc.

## Sequential email loops in serverless routes timeout for large audiences

- **Mistake risk:** Sending emails to all school users in a `for...of await sendEmail(...)` loop can take 60–120+ seconds for schools with 200+ users, exceeding Vercel function timeout.
- **Root cause:** Serverless functions have hard execution limits (10 s Hobby / 60 s Pro); sequential network I/O cannot be batched after the fact.
- **Prevention:** Use the email provider's batch API (e.g. Resend `POST /emails/batch`, up to 100 per request) or wrap the send loop in `after()` from `next/server` and return the response immediately with a queued count.
- **Checks:** Estimate max loop time: `(user count) × (avg email latency ms) / 1000 < function timeout in seconds`. If > 50% of budget, switch to batch API.

## Finance module tables use camelCase PostgreSQL column names

- **Mistake:** Phase 0 migration used snake_case `fee_structure_id` in a unique index on `fee_structure_items`; migrate deploy failed with 42703 because the finance module created columns as `"feeStructureId"` (see `20260405190838_add_finance_module/migration.sql`).
- **Root cause:** Older finance migrations predated consistent `@map` snake_case; Prisma model fields map to camelCase DB columns for that module.
- **Prevention:** Before writing raw SQL against finance tables, grep `prisma/migrations/**/migration.sql` for the actual quoted column names on the target table; do not assume snake_case from `@map` on newer models only.
- **Checks:** `grep fee_structure_items prisma/migrations/20260405190838_add_finance_module/migration.sql`; `npx prisma migrate deploy` on local DB after adding finance migrations.

## Finance import scripts must match actual Prisma fields per model

- **Mistake:** SRFS finance seed/import scripts used `deletedAt` on `Term` and `Grade`, `deletedAt` on `User`, and `gradeId` on `Student` — fields that do not exist on those models (Student uses `currentGradeId`; User uses `status`).
- **Root cause:** Assumed soft-delete and FK naming from other models (`StudentBill.deletedAt`) without checking `schema.prisma` for each queried model.
- **Prevention:** Before writing production import scripts, grep the target model in `schema.prisma` for available filters and FK names. Dry-run against production read-only first. Skip spreadsheet rows that are sub-tables (e.g. Bill Structure transport tier rows labelled `T1`–`T4`).
- **Checks:** `npx tsx scripts/<import>.ts --dry-run` exit 0; `npx tsc --noEmit 2>&1 | grep scripts/` clean; compare grade list from audit JSON vs spreadsheet.


- **Mistake:** SRFS finance seed/import scripts used `deletedAt` on `Term` and `Grade`, `deletedAt` on `User`, and `gradeId` on `Student` — fields that do not exist on those models (Student uses `currentGradeId`; User uses `status`).
- **Root cause:** Assumed soft-delete and FK naming from other models (`StudentBill.deletedAt`) without checking `schema.prisma` for each queried model.
- **Prevention:** Before writing production import scripts, grep the target model in `schema.prisma` for available filters and FK names. Dry-run against production read-only first. Skip spreadsheet rows that are sub-tables (e.g. Bill Structure transport tier rows labelled `T1`–`T4`).
- **Checks:** `npx tsx scripts/<import>.ts --dry-run` exit 0; `npx tsc --noEmit 2>&1 | grep scripts/` clean; compare grade list from audit JSON vs spreadsheet.

## Fuzzy student name match must reject legacy ID conflicts

- **Mistake:** Spreadsheet `legacyStudentId` not in DB caused fuzzy match to a different student who already had another legacy ID (e.g. `Odoi Tetteh Ethel` / `20250009` → `Tetteh Wilson Corley` / `20240031`) — would attach payments to wrong child.
- **Root cause:** Name matcher only compared tokens; did not check whether the matched DB row already carried a conflicting `legacyStudentId`.
- **Prevention:** In import `matchStudent` helpers, after fuzzy match, call `hasLegacyIdConflict(spreadsheetId, candidate)` and skip auto-match when the DB row has a different non-empty legacy ID. Document unresolved rows in `import-srfs-name-match-report.json` for manual enrollment or legacy assignment.
- **Checks:** `npx vitest run src/test/finance/student-name-match.test.ts`; prod dry-run `import-srfs-finance.ts` unmatched list should not include false-positive surname-only links.

## In-process LRU cache needed for server-only assets fetched per-request in dynamic Route Handlers

- **Mistake risk:** `loadLogoBuffer` uses `fetch(url, { cache: 'force-cache' })` inside a `force-dynamic` route handler. In Next.js 15 the Data Cache behaviour for fetch in dynamic handlers is unpredictable; in practice each handler invocation may re-fetch the external logo URL.
- **Root cause:** Next.js 15 changed fetch caching defaults; `force-cache` in a `force-dynamic` handler only works reliably with a persistent Data Cache adapter (Vercel Incremental Cache).
- **Prevention:** For route handlers that serve images or other binary assets derived from external URLs, use a module-level `LRUCache` (from `lru-cache`) keyed by URL with a TTL matching the browser `Cache-Control` max-age. Module-level caches persist across warm invocations on Vercel Fluid Compute.
- **Checks:** Add `lru-cache` module-level Map in `loadLogoBuffer`; verify cache hit on second identical request in integration test.

## SRFS legacy student import: surname-only fuzzy match creates false positives

- **Mistake:** Fuzzy name fallback matched spreadsheet rows like "Odoi Tetteh Ethel" to "Tetteh Wilson Corley" because the shared token `Tetteh` scored above threshold without given-name overlap.
- **Root cause:** Token-overlap scoring treated surname tokens in spreadsheet given-name positions as full matches; spreadsheet uses surname-first ordering with hyphenated/compound names.
- **Prevention:** Centralize matching in `student-name-match.ts`: normalize hyphens, score surname-first and given-first order, cap score when only surname overlaps, require `givenNameOverlap` before auto-assigning `legacyStudentId`. Run read-only `match-srfs-student-names.ts` against prod before `--execute`.
- **Checks:** `npx vitest run src/test/finance/student-name-match.test.ts`; `npx tsx scripts/match-srfs-student-names.ts --env-file .env.production.local` — confirm ambiguous rows flagged `manual_review`.

## Vitest finance DB tests skip unless DATABASE_URL is in the process environment

- **Mistake:** Running `npm run test -- --config vitest.finance.config.ts --run src/test/finance/term-fee-legacy-sync-upsert.test.ts` without exporting `DATABASE_URL` reports **7 skipped** tests and exit 0 — looks green while Phase 0 integration coverage never ran.
- **Root cause:** `describe.skipIf(!process.env.DATABASE_URL)` gates the suite; `vitest.finance.config.ts` does not load `.env` / `.env.local` (unlike Next.js dev).
- **Prevention:** Before finance integration runs, `export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | grep -v '^#' | xargs)` from `learn-motive` (or set `DATABASE_URL` explicitly). Treat skipped count > 0 on DB-gated files as a test harness failure for gated workflow Tester handoff.
- **Checks:** Assert output shows `7 passed` not `7 skipped`; `echo $DATABASE_URL | wc -c` > 1 before `npm run test:finance`.

## Finance tables UI pattern — sticky header, client pagination, full-dataset filters

- **Mistake:** Billing student bills table used server-side `skip/take` pagination while sort/filter/search ran on the current page only; selection totals and “select all” only covered visible rows. Finance drawers portaled to `document.body` without `portal-mockup finance-mockup` rendered white panels in dark admin theme.
- **Root cause:** Mixed server pagination with client-side `useClientTableSortFilter`; drawer CSS selectors require `.portal-mockup .fin-drawer` ancestor which portaled nodes lack.
- **Prevention:** For finance registers: fetch full term dataset (or client-filter first), apply search/filters/sort on full array, paginate display with `usePaginatedRows(rows, 50)` + `FinTablePagination`; keep selection/totals on full filtered set; select-all toggles all filtered rows. Wrap portaled drawers in `FinanceDrawerPortal` (`portal-mockup finance-mockup fin-drawer-root`). Use `fin-table-wrap fin-table-wrap--sticky fin-table-wrap--register` (~80vh scroll). Term setup wizard: auto-open only once per incomplete term; persist dismiss in `localStorage` key `finance:setupWizardDismissedTermIds` or `termSetupCompletedAt`.
- **Checks:** Billing Operations shows “Showing 1–50 of N · Page 1 of M”; summary totals unchanged when paging; drawer panels use `#111614` / `var(--portal-surface)` in dark theme; term wizard does not reopen after Skip/× until “Term setup” clicked.
