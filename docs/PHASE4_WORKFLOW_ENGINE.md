# Phase 4 — WorkflowEngine foundation (Sprint 4)

## WorkflowEngine

`WorkflowEngineService` (`apps/api/src/workflows/workflow-engine.service.ts`) routes **system triggers** to workflow creation. Derived instance status: open until all tasks complete.

## Triggers

| Trigger | When | Result |
|---------|------|--------|
| `sop_submitted_for_approval` | `POST /approvals/processes/:id/submit` | Single approval task workflow for assigned approver |

## Manual start removed

- `POST /api/v1/workflows` returns `MANUAL_START_DISABLED`
- `/workflows/new` redirects to `/workflows`

## Tests

`apps/api/test/spec-sprint-4.test.ts` — S4-WF-01, S4-WF-02.
