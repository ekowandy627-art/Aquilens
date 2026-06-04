# Phase 10 — Audit extensions + guest auditor

- Demo role `Guest Auditor` (`user-gis-guest-auditor`) with `audit:read`, `audit_packs:read`, `processes:read`
- Guest access grants include `jurisdictionIds` for pack scope
- Audit packs store `jurisdictionIds` on generation
- Incident/SIAI events appear in audit log (`incident.logged`, etc.)
- Tests: `apps/api/test/spec-sprint-10.test.ts`
