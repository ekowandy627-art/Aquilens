# Phase 8 — Readiness score

Five equal-weight components (0–100 each): processes covered, training current, control points evidenced, standards gaps, open incidents/SIAI.

- Exposed on admin and compliance dashboard summaries as `readiness`
- Cron: `POST /api/internal/cron/readiness-notifications`
- Tests: `apps/api/test/spec-sprint-8.test.ts`
