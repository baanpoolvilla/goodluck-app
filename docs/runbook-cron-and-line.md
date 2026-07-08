# Runbook — Cron Jobs & LINE Integration

## One-time setup on a real Supabase project

1. `supabase link --project-ref <ref>`
2. `supabase db push` (applies `supabase/migrations/*` in order)
3. `supabase db seed` or run `supabase/seed.sql` manually — creates the
   admin user (`admin@company.local` / `ChangeMe123!` — change immediately),
   `grade_configs`, and default `app_hub_items`.
4. Deploy Edge Functions: `supabase functions deploy <name>` for each folder
   under `supabase/functions/` (skip `_shared`).
5. Edit `supabase/migrations/0007_cron_jobs.sql`, replacing `<PROJECT_REF>`
   and `<SERVICE_ROLE_JWT>`, then apply it (ideally move the JWT into
   Supabase Vault instead of hardcoding it in SQL).
6. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `APP_URL`.
7. In the LINE Developers console, set the webhook URL to
   `https://<your-domain>/api/webhooks/line` and enable "Use webhook".

## Cron schedule

| Function | Schedule | Purpose |
|---|---|---|
| `daily-report-checker` (phase=remind) | `0 20 * * 1-5` | LINE-remind anyone missing today's report |
| `daily-report-checker` (phase=penalize) | `30 20 * * 1-5` | After the grace period, penalize anyone still missing |
| `task-deadline-checker` | `0 * * * *` | Flip `pending`/`in_progress` past deadline to `overdue`, apply penalty, notify |
| `task-reminder-24h` | `0 9 * * *` | Remind assignees of tasks due within 24h |
| `monthly-grade-calculator` | `0 2 1 * *` | Recalculate previous month for every active user, push summary |

## Idempotency

- `penalty_logs` has a unique key on `(module, reference_id, penalty_date)` —
  re-running any checker for the same day upserts instead of duplicating.
- `monthly_grades` has a unique key on `(user_id, month)` — safe to
  re-trigger via `POST /api/grades/calculate`.

## If a cron run fails

1. Check Edge Function logs: `supabase functions logs <name>`.
2. Each function returns/logs a structured JSON summary
   (`{ fn, ...counts }`) — look for the failing `userId`/`taskId` in the
   error lines rather than re-running blind.
3. Re-invoke manually once the root cause is fixed:
   `supabase functions invoke <name> --body '{"phase":"remind"}'`.
   Safe to retry — see idempotency notes above.

## LINE account linking

There's no LINE Login/OAuth flow yet (see spec section 15, "Future
Enhancements"). For now, a user DMs the bot their company email; the
webhook handler (`app/api/webhooks/line/route.ts`) matches it against
`public.users.email` and stores `line_user_id`. Anyone without a linked
`line_user_id` simply doesn't receive push messages — `lib/line/client.ts`
no-ops rather than throwing.
