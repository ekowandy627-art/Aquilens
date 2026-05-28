# Aquilens

Governance and compliance platform for schools and institutions.

## Quick start (local demo)

```bash
npm install
npm run seed:demo    # reset GIS demo data
npm run dev:api      # http://localhost:3001
npm run dev:web      # http://localhost:3000
```

Log in with any GIS demo user (password `Aquilens2024!`):

- `gis-admin@aquilens.test` — Sarah Mensah (Super Admin)
- `gis-compliance@aquilens.test` — James Asante (Compliance Officer)
- `gis-head@aquilens.test` — Dr. Ama Boateng (Department Head)
- `gis-owner@aquilens.test` — Michael Darko (Process Owner)
- `gis-staff@aquilens.test` — Grace Osei (Staff)

Without Supabase configured, the API uses in-memory demo stores and the web app uses local demo auth.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run seed:demo` | Reset GIS tenant demo data and print summary |
| `npm run seed:supabase-auth` | Seed Supabase auth users and GIS scaffold (requires env vars) |
| `npm test` | Run API test suite |
| `npm run build` | Build web + API |

Copy `.env.example` to `apps/api/.env` and `apps/web/.env.local` as needed.
