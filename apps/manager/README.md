# Aquilens Manager

Platform admin console for **tenants** and **standards packs**, modeled after the Learn Motive manager ↔ school split.

## Architecture

| App | Port | Role |
|-----|------|------|
| `apps/web` | 3000 | Tenant users (processes, audit, etc.) |
| `apps/api` | 3001 | Tenant API + `/api/internal/*` for manager |
| `apps/manager` | 3002 | Platform operators |

### Communication (Learn Motive pattern)

```text
Tenant web  --MANAGER_LOOKUP_SECRET-->  Manager /api/internal/tenant-lookup
                                              |
                                              v
Manager     --MANAGER_PLATFORM_SECRET-->  API /api/internal/*
```

Unlike Learn Motive, Aquilens uses a **single Supabase database** with `tenant_id` RLS — the manager does not provision per-tenant databases. Lookup returns tenant metadata (name, status, slug) instead of a database URL.

## Setup

1. Apply migration `supabase/migrations/202606040001_platform_manager.sql`
2. Copy `apps/manager/.env.example` → `apps/manager/.env.local`
3. Set matching secrets on `apps/api/.env`:
   - `MANAGER_PLATFORM_SECRET` (same value as manager)
4. Optional tenant web branding (`apps/web/.env.local`):
   - `MANAGER_LOOKUP_URL=http://localhost:3002`
   - `MANAGER_LOOKUP_SECRET` (same as manager)
5. Bootstrap platform admin:

```bash
PLATFORM_BOOTSTRAP_EMAIL=platform-admin@aquilens.test \
PLATFORM_BOOTSTRAP_PASSWORD='AquilensPlatform2024!' \
npm run bootstrap:platform
```

6. Run all three apps:

```bash
npm run dev:api      # :3001
npm run dev:web      # :3000
npm run dev:manager  # :3002
```

7. Open http://localhost:3002/platform/login

## Features

- **Tenants**: list, onboard (Supabase tenant + super admin), suspend/activate
- **Standards packs**: list global guidance packs, activate/deactivate
- **Platform audit log**: onboard and pack changes recorded in `platform_audit_log`
