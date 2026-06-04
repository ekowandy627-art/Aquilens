# Phase 5 — Incidents, SIAI, and resolution workflows

## API

- `GET/POST /api/v1/incidents` — list and log incidents
- `GET /api/v1/incidents/:id` — detail with derived status and actions
- `POST /api/v1/incidents/:id/actions` — add corrective/preventive action
- `POST /api/v1/incidents/:id/actions/:actionId/complete` — complete with notes, URLs, file IDs
- `POST /api/v1/incidents/:id/open-resolution` — Compliance Officer reopens resolution workflow
- `GET/POST /api/v1/siai` — SIAI register (same resolution path)
- `POST /api/v1/siai/:id/open-resolution` — CO manual resolution

## Workflow triggers

- `incident_logged` — creates two-step resolution workflow (corrective action + senior sign-off)
- `siai_created` — same template for SIAI records

## Rules

- **Raiser ≠ closer:** if the incident raiser completes senior sign-off, derived status stays open; a different user must sign off for `closed`.
- **Derived status:** `open`, `action_required`, `resolution_in_progress`, `closed` (from workflow tasks and incident actions).
- **CO open-resolution:** when the linked workflow instance is missing, Compliance Officers can start a new resolution workflow.

## Demo permissions

`user-gis-compliance` and `user-gis-owner` include `incidents:read|create|edit`. Workflow task completion uses `workflows:complete`.

## Tests

`apps/api/test/spec-sprint-5.test.ts`
