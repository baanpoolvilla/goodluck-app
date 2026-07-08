# Company Ops & Grading System

Task management, daily reports, monthly grading, and an App Hub landing
page — see `../company-ops-grading-system.md` for the full spec this
implements.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Base UI) on
the frontend; Supabase (Postgres, Auth, Realtime, RLS, Edge Functions) on
the backend. See `docs/api-contract.md`, `docs/rls-policy-matrix.md`, and
`docs/runbook-cron-and-line.md` for how the two sides fit together.

## Getting started

```bash
npm install
npm run dev
```

`.env.local` already has placeholder Supabase values so `next dev` boots.
To connect a real backend:

1. Create a Supabase project.
2. `supabase link --project-ref <ref> && supabase db push` — applies
   `supabase/migrations/*` (schema, RLS, grading functions).
3. Run `supabase/seed.sql` for the admin user + default config.
4. Copy real values into `.env.local` (see `.env.example`).
5. Follow `docs/runbook-cron-and-line.md` to deploy the Edge Functions and
   wire up LINE notifications.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`
- `npm run test` — Vitest unit tests (`tests/`)

## Project layout

- `app/` — routes: `(auth)` for login/register, `(dashboard)` for
  everything behind the app shell, `api/` for route handlers.
- `components/` — grouped by module (`tasks/`, `reports/`, `grades/`,
  `hub/`, `layout/`, `auth/`).
- `lib/` — `supabase/` (browser/server/admin/middleware clients),
  `auth/` (session helpers), `grading/` (pure calculation helpers mirrored
  in SQL), `validation/` (zod schemas), `line/` (push message client).
- `supabase/` — `migrations/`, `seed.sql`, `functions/` (Deno Edge
  Functions for the cron jobs — a separate TS project, excluded from the
  root `tsconfig.json`).
