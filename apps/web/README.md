## Aquilens Web (`apps/web`)

Next.js frontend for Aquilens (App Router).

## Getting Started

### 1) Configure environment variables

Create `apps/web/.env.local` using `apps/web/.env.example` as the template.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3001/api/v1` for local API dev)

### 2) Run the development server

From the repo root:

```bash
npm run dev
```

Or run the web app only:

```bash
npm run dev:web
```

Open `http://localhost:3000`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API dependency

The web app calls the API at `NEXT_PUBLIC_API_BASE_URL`. Run the API locally with:

```bash
npm run dev:api
```

## Deploy

This repo is already linked to Vercel (see `.vercel/project.json`). Ensure the same env vars from
`apps/web/.env.example` are configured in the Vercel project environment.
