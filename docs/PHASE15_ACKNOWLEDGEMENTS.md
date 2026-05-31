# Phase 15 — Staff acknowledgement

Staff read procedure tutorials and confirm published SOP versions. Process owners track completion on the process detail **Acknowledgements** tab.

## API (demo mode)

| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/v1/acknowledgements/my` | `acknowledgements:complete` |
| GET | `/api/v1/acknowledgements/assignments/:assignmentId/sop` | `acknowledgements:complete` | Version-scoped read-only SOP |
| POST | `/api/v1/acknowledgements/:assignmentId/confirm` | `acknowledgements:complete` |
| GET | `/api/v1/processes/:id/acknowledgements` | `acknowledgements:read` |
| POST | `/api/v1/processes/:id/acknowledgements/campaigns` | `acknowledgements:manage` |
| GET | `/api/v1/acknowledgements/overdue` | `acknowledgements:read` |

Publishing with `acknowledgementRequired: true` creates a campaign and assigns GIS staff (`user-gis-staff`) in demo mode.

## Web

- `/my-acknowledgements` — staff pending list
- `/my-acknowledgements/[assignmentId]` — redirects to `/processes/[id]/tutorial?acknowledge=…` for read + confirm
- Process detail → **Acknowledgements** tab — campaigns, assignee status, completion %

## Demo users

- **Grace Osei** (`gis-staff@aquilens.test`) — `acknowledgements:complete`
- **Michael Darko** (`gis-owner@aquilens.test`) — `acknowledgements:read`, `acknowledgements:manage`

Seeded campaign: **Enrol New Student** v3 with a pending assignment for Grace.

## Tests

```bash
npm run test:api -- acknowledgements
npm run test:api -- acknowledgement-status
```
