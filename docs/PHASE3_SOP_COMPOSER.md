# Phase 3 — Unified SOP Composer (Sprint 3)

## Routes

| Route | Status |
|-------|--------|
| `/processes/compose` | Primary composer UI |
| `/processes/new`, `/processes/generate/*`, `/processes/new/upload` | Redirect → compose |
| `/processes/new/manual` | Manual wizard (linked from compose) |

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/sop/compose/suggestions?functionId=` | Recommended + tenant-selected packs; requires user confirmation |
| POST | `/api/v1/sop/transcribe` | OpenAI Whisper (`OPENAI_API_KEY`); mock transcript without key |
| POST | `/api/v1/sop/compose` | NDJSON stream: progress → steps → gaps → decisions → complete |
| POST | `/api/v1/sop/resolutions` | Persist conflict choice to `sop_source_resolutions` |
| GET | `/api/v1/sop/resolutions` | List by `processId` / `draftHash` |
| POST | `/api/v1/sop/generate` | Deprecated; retained for regression tests |

Set `SOP_COMPOSE_MOCK_STREAM=true` in tests to avoid LLM calls.

## Stream events

- `progress` — status message
- `step` — composed step with `provenance[]`
- `gap` — inline gap chip data
- `decision` — conflict resolution chips
- `complete` — final draft, gaps, `draftHash`

## Schema

`supabase/migrations/202606080001_sop_source_resolutions.sql`

## Tests

`apps/api/test/spec-sprint-3.test.ts` — S3-SUG, S3-TRAN, S3-COMP, S3-RES.
