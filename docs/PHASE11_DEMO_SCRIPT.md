# GIS 10-minute demo script (Phase 11)

Run `npm run seed:demo` before the demo.

| Step | User | Action | Route |
|------|------|--------|-------|
| 1 | `gis-admin@aquilens.test` | Dashboard — open items | `/dashboard` |
| 2 | Admin | Function tree / settings | `/settings/structure` |
| 3 | Admin | Open active SOP | `/processes` → Enrol New Student |
| 4 | Admin | In-progress workflow timeline | `/workflows` |
| 5 | `gis-staff@aquilens.test` | My Tasks → complete task | `/my-tasks` |
| 6 | `gis-head@aquilens.test` | Approval queue | `/approvals` |
| 7 | `gis-compliance@aquilens.test` | Audit trail | `/audit` |
| 8 | Compliance | Generate audit pack | `/audit-packs` |
| 9 | Admin | AI agent attestation | `/agents` |

**Pass criteria:** No 404/500, evidence upload works on required tasks, PDF download opens.
