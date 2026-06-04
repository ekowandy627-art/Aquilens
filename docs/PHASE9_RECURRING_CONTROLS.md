# Phase 9 — Recurring control records

- `GET/POST /api/v1/recurring-controls`
- `PATCH /api/v1/recurring-controls/:id/verification` — `unverified | sampled | verified`
- Linked to control points via `controlPointStepId` / `processId`
- Tests: `apps/api/test/spec-sprint-9.test.ts`
