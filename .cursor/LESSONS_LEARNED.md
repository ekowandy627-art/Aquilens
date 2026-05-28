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

## npm test can hang if Nest apps do not close

- **Mistake:** `tsx --test` hung indefinitely after workflow tests.
- **Root cause:** Open handles from NestJS `app.init()` when tests fail mid-suite.
- **Prevention:** Always `await app.close()` in each test; use `node --test-force-exit --import tsx test/*.test.ts` when debugging hangs.
- **Checks:** `cd apps/api && node --test-force-exit --import tsx test/workflows.test.ts`
