# Phase 7 — Agent attestation due workflow

- Trigger: `agent_attestation_due` via `WorkflowEngineService`
- Cron: `POST /api/internal/cron/attestation-due` (Bearer `MANAGER_PLATFORM_SECRET`)
- Creates attestation review workflow and `attestation_due` notification
- Tests: `apps/api/test/spec-sprint-7.test.ts`
