# E2E coverage matrix (GIS demo tenant)

Maps product flows to **API tests** (`apps/api/test/`) and **Playwright** (`apps/web/e2e/`). Status reflects the GIS in-memory demo (`POST /demo/reset-gis`, `ALLOW_DEMO_BEARER=true`).

## How to run

```bash
# Terminal 1 — API (demo bearer + in-memory stores)
ALLOW_DEMO_BEARER=true npm run dev:api

# Terminal 2 — Web (demo session cookie)
npm run dev:web
# or production build on another port:
# PORT=3010 ALLOW_DEMO_SESSION=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1 npm --prefix apps/web run start

# Terminal 3 — Playwright (reuses running web on :3000 when present)
npm run test:e2e
```

| Spec file | Scope |
|-----------|--------|
| `e2e/golden-path.spec.ts` | Cross-role MVP journey (GP-01 … GP-12) |
| `e2e/process-publish.spec.ts` | Phase 13 SOP control & publish (P13-UI-*) |
| `e2e/training.spec.ts` | Training module / My Training (TRN-UI-*) |
| `e2e/phase12-product-language.spec.ts` | Phase 12 copy / disclaimer (P12-UI-*) |

## Flow matrix

| ID | Flow | Primary UI route | API coverage | E2E | Notes |
|----|------|------------------|--------------|-----|-------|
| F01 | Demo reset / GIS seed | — | `processes.test`, `workflows.test` | `beforeAll` in all e2e | `POST /demo/reset-gis` |
| F02 | Auth / session (demo cookie) | `/dashboard` | `auth.test` | All specs via `signInAs` | `ALLOW_DEMO_SESSION=true` on web |
| F03 | Org structure (functions) | `/settings/structure` | `processes.test` (scaffold) | GP-03 | Admin only (`settings:edit` / `*`) |
| F04 | Register AI agent | `/agents/new` | `agents.test` | GP-02 | Compliance (`agents:create`) |
| F05 | Agent registry list/detail | `/agents`, `/agents/[code]` | `agents.test` | GP-02 | |
| F06 | Create SOP (manual wizard) | `/processes/new/manual` | `processes.test` | GP-04 (smoke) | Full wizard not automated |
| F07 | Create SOP (upload) | `/processes/new/upload` | `process-documents.test` | — | |
| F08 | Edit SOP / control fields | `/processes/[id]/edit`, Control tab | `sop.test`, `process-publish.test` | P13-UI-01, GP-06 | |
| F09 | Submit SOP for approval | `/processes/[id]` | `approvals.test`, `process-lifecycle.test` | GP-06 | Owner |
| F10 | Approve SOP (queue) | `/approvals`, `/approvals/[id]` | `approvals.test` | GP-07 | Department head |
| F11 | Publish SOP | Publish dialog on process detail | `process-publish.test` | P13-UI-02/04, GP-08 | Owner |
| F12 | SOP documents tab | Documents tab | `process-documents.test` | P13-UI-06 | |
| F13 | Start workflow from active SOP | `/workflows/new` | `workflows.test` | GP-09 | Requires `processes:edit` |
| F14 | Workflow task actions | `/workflows/[id]`, `/my-tasks` | `workflows.test`, `evidence.test` | GP-10 | Staff on assigned seeded instance |
| F15 | My tasks inbox | `/my-tasks` | `workflows.test` | GP-10 | |
| F16 | Audit trail + CSV export | `/audit` | `audit.test` | GP-11 | Compliance |
| F17 | Audit pack generate/download | `/audit-packs` | `audit.test`, `audit-pack-legal.test` | GP-12 | Poll until `ready` |
| F18 | Staff training (acknowledge-only) | `/my-training` | `spec-sprint-6.test.ts` | TRN-UI-*, GP-13 | Replaces legacy acknowledgements |
| F19 | Staff dashboard pending training | `/dashboard` | `dashboard.test`, `spec-sprint-6.test.ts` | GP-14 | Staff role |
| F20 | Guidance / standards onboarding | `/onboarding`, `/settings/standards` | `standards.test`, `guidance-recommendations.test` | P12-UI-* (partial) | |
| F21 | Dashboard / notifications | `/dashboard`, `/notifications` | `dashboard.test`, `notifications.test` | GP-01 (smoke) | |
| F22 | Archive SOP | Archive on process detail | `process-lifecycle.test` | — | P13-UI-07 not automated |
| F23 | Alignment dashboard (Phase 16) | `/alignment` | — | — | Not built yet |

## Golden-path test IDs (`golden-path.spec.ts`)

| Test | Roles | Validates |
|------|-------|-----------|
| GP-01 | Compliance | Core nav routes load (agents, audit, audit-packs, processes, workflows) |
| GP-02 | Compliance | Register agent end-to-end |
| GP-03 | Admin | Structure settings: add function + save scaffold |
| GP-04 | Owner | Manual SOP create wizard loads |
| GP-05 | Owner | Processes list shows seeded GIS SOPs |
| GP-06 | Owner | Submit fees SOP for approval |
| GP-07 | Head | Approve fees from approvals queue |
| GP-08 | Owner | Publish fees SOP (effective + review dates) |
| GP-09 | Owner | Start workflow from active enrolment SOP |
| GP-10 | Staff | Approve in-progress safeguarding task on seeded workflow |
| GP-11 | Compliance | Audit trail lists events |
| GP-12 | Compliance | Generate audit pack and reach ready/download |
| GP-13 | Staff | Complete acknowledge-only training on My Training |
| GP-14 | Staff | Dashboard shows pending training |

## Gaps (intentional or backlog)

- **Full manual SOP wizard** (F06): five-step create with steps/people — API only.
- **New version publish training reassignment**: needs isolated seed; API partial.
- **Workflow task on newly started instance** (F14): UI start does not set assignees; staff cannot act until assigned — use seeded `workflow-gis-enrolment-t2` for task UI.
- **Archive SOP** (F22), **alignment** (F23), **internal audits** (Phase 17+): no Playwright yet.
- **Supabase-backed tenant**: matrix assumes GIS demo mode; production paths need separate suite.

## PRD cross-reference

Numbered UI cases live in [`docs/PRD_DELTA_PLAN.md`](PRD_DELTA_PLAN.md) (`P12-UI-*` … `P19-UI-*`). This matrix is the **operational** view of what Playwright actually runs today.
