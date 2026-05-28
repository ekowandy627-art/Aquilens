# Phase 12 — Product language and legal framing

## Delivered

- `packages/shared/src/legal.ts` — `LEGAL_DISCLAIMER`, forbidden-term helpers
- `packages/shared/src/alignment-status.ts` — approved status labels for Phases 16–17
- `apps/web/src/components/legal-disclaimer.tsx` — reusable UI block
- Audit pack PDF: per-page footer + full legal notice section
- `docs/ROLE_PERMISSION_MATRIX.md` — PRD roles ↔ GIS demo roles
- `scripts/check-product-language.mjs` — CI scan for forbidden UI copy
- Playwright: `apps/web/e2e/phase12-product-language.spec.ts`

## Verification

```bash
npm run test:shared
npm run test:api
npm run check:product-language
npm --prefix apps/web run build
```

### Playwright (Phase 12 UI)

Start API + web, then run E2E:

```bash
npm run dev:api   # :3001
ALLOW_DEMO_SESSION=true npm run dev   # :3000
npm run test:e2e
```

CI / production bundle against a running server:

```bash
npm --prefix apps/web run build
PORT=3010 ALLOW_DEMO_SESSION=true npm --prefix apps/web run start
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npx playwright test --config apps/web/playwright.ci.config.ts
```

E2E seeds demo session via `localStorage` + `aquilens-demo-session` cookie. Auth uses a shared `AuthProvider` (single context) with cookie fallback and Supabase timeouts so sessions do not hang on “Checking session…”.
```

## Locked decisions applied

- Staff **cannot** access Standards Alignment (Phase 16 nav — document only here)
- Operational home remains **Operational Control Room**, not a compliance dashboard
