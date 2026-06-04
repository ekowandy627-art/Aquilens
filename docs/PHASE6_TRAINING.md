# Phase 6 — Training module

- `GET /api/v1/training/my` — staff assignments
- `POST /api/v1/training/assignments/:id/acknowledge` — acknowledge-only modules
- `GET .../quiz` + `POST .../submit` — assessed modules (80% pass, 10 questions drawn from bank)
- Web: `/my-training` (legacy `/my-acknowledgements` removed)
- Tests: `apps/api/test/spec-sprint-6.test.ts`
