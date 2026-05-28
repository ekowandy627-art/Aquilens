# Phase 13 — SOP control enrichment

## Delivered

- Migration `supabase/migrations/202606010001_phase13_sop_control.sql`
- Approve → version status `approved`; publish → process/version `active` with effective and review dates
- API: `POST /processes/:id/publish`, `POST /processes/:id/archive`, `GET|POST /processes/:id/documents`
- Web: Control tab, publish dialog, documents upload, version history publication metadata
- Upload entry: `/processes/new/upload`

## Verification

```bash
npm run test:api
npm run test:shared
npm --prefix apps/web run build
npm run dev:api
ALLOW_DEMO_SESSION=true npm run dev

For Playwright / production `next start` on port 3010, also run the API with demo bearer + CORS:

```bash
ALLOW_DEMO_BEARER=true CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3010,http://localhost:3010 npm run dev:api
PORT=3010 ALLOW_DEMO_SESSION=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1 npm --prefix apps/web run start
```
npm run test:e2e
```

Playwright Phase 13: `apps/web/e2e/process-publish.spec.ts`

## Demo flow

1. Edit draft SOP → set trigger/participants on Governance step → save
2. Submit for approval → approver approves (`approved` version)
3. Process owner publishes with effective date → status `active`
4. Upload related document on Documents tab
