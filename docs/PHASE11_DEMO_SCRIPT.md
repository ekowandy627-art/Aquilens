# GIS 10-minute demo script (Phase 11)

Run `npm run seed:demo` before the demo.

| Step | User | Action | Route |
|------|------|--------|-------|
| 1 | `gis-admin@aquilens.test` | Dashboard — open items | `/dashboard` |
| 2 | Admin | Function tree / settings | `/settings/structure` |
| 3 | Admin | Open active SOP | `/processes` → Enrol New Student |
| 4 | Admin | In-progress compliance record timeline | `/workflows` |
| 5 | `gis-staff@aquilens.test` | Reference dashboard — open tutorial, confirm acknowledgement | `/dashboard` → tutorial |
| 6 | `gis-head@aquilens.test` | Approval queue | `/approvals` |
| 7 | `gis-compliance@aquilens.test` | Audit trail | `/audit` |
| 8 | Compliance | Generate audit pack | `/audit-packs` |
| 9 | Admin | AI agent attestation | `/agents` |

**Pass criteria:** No 404/500, staff see acknowledgements and tutorials (not workflow tasks), compliance record evidence upload works, PDF download opens.

**Positioning note:** Aquilens is a governance and reference system. Staff read procedures and acknowledge updates; owners/compliance log optional compliance records with evidence for audit.
