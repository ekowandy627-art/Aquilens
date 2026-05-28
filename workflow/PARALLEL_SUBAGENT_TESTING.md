# Parallel subagent testing (gated workflow)

When multiple Builder subagents run at the same time, the **parent agent** owns Tester and Approver roles. Subagents must not mark phases complete.

## After each subagent returns

1. **Scope check** — Diff only touches the subagent’s phase and `project_folder` paths from `context.yaml`.
2. **Reset demo stores** (if API tests involved):
   ```bash
   npm run seed:demo
   ```
3. **API regression** (required):
   ```bash
   npm test
   ```
4. **Phase-focused tests** (required when a suite exists):
   ```bash
   cd apps/api && npx tsx --test test/<phase>.test.ts
   ```
5. **Web build** (required if any `apps/web` files changed):
   ```bash
   cd apps/web && npm run build
   ```
6. **Update** `workflow/runs/aquilens-build-plan/phase-state.yaml`:
   - `tester.status` = PASS | FAIL
   - `tester.commands_run`, `tester.results`, `tester.findings`
7. **Approver** reviews only after Tester PASS.

## Phase → test file map

| Phase | Primary test files |
|-------|-------------------|
| 5 | `approvals.test.ts` |
| 6 | `workflows.test.ts` |
| 7 | `evidence.test.ts`, `workflows.test.ts` |
| 8 | `agents.test.ts` |
| 9 | `notifications.test.ts`, `dashboard.test.ts` |
| 10 | `audit.test.ts` |
| 11 | Full suite + `npm run seed:demo` + manual demo script |

## Hang prevention

If `npm test` never exits:

```bash
cd apps/api && node --test-force-exit --import tsx test/*.test.ts
```
