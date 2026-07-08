# API Contract

All routes are Next.js Route Handlers under `app/api/*`. Auth is via the
Supabase session cookie (set by `proxy.ts` / the login flow) — no separate
API tokens. Responses are `{ data }` on success or `{ error }` on failure
unless noted.

## Tasks

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/tasks` | any | Query: `status`, `assigned_to`, `from`, `to`, `q`, `page`, `page_size`. RLS scopes rows to own tasks unless manager/admin. |
| POST | `/api/tasks` | manager+ | Body: `title, description?, assigned_to, priority?, deadline, grade_weight?, tags?` |
| GET | `/api/tasks/:id` | any (RLS-scoped) | |
| PATCH | `/api/tasks/:id` | assignee (status only) or manager+ (any field) | Status changes validated against `TASK_STATUS_TRANSITIONS` in `lib/validation/tasks.ts`. |
| DELETE | `/api/tasks/:id` | manager+ | |
| GET/POST | `/api/tasks/:id/comments` | participants (assignee/assigner) or manager+ | |

## Daily Reports

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/reports?month=YYYY-MM` | own | |
| POST | `/api/reports` | own | Enforces one row per `(user_id, report_date)`; marks `is_late` and applies the 0.5x late penalty via the service-role client if submitted after the configured deadline but within the grace period. Returns 422 once the grace period has passed. |
| GET | `/api/reports/team?date=YYYY-MM-DD` | manager+ | Full active-user roster cross-joined with that day's reports. |

## Grades

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/grades?user_id=` | own by default; manager+ for others | Last 12 months. |
| POST | `/api/grades/calculate` | admin | Body: `{ month, user_id? }`. Omit `user_id` to recalculate every active user via `calculate_monthly_grade`. |
| GET/PATCH | `/api/grade-configs` | read: any; write: admin | PATCH body: `{ module: 'task'|'daily_report', ...fields }`. Rejects a `weight_percent` change that would break the "sums to 100" invariant. |

## App Hub

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/hub` | any | RLS filters to active items where the caller's role is in `allowed_roles` (admins see everything via a separate policy). |
| POST | `/api/hub` | admin | |
| PATCH/DELETE | `/api/hub/:id` | admin | |

## Users

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/users` | manager+ | |
| PATCH | `/api/users` | admin | Body: `{ id, role?, department?, is_active?, line_user_id? }` |

## Webhooks

| Method | Path | Notes |
|---|---|---|
| POST | `/api/webhooks/line` | Verifies `x-line-signature` via `LINE_CHANNEL_SECRET`. Account-linking flow: user DMs the bot their company email; matched against `public.users.email` to set `line_user_id`. |

## Status codes

`200/201` success, `204` deleted, `400` validation error, `401` unauthenticated,
`403` forbidden, `404` not found, `409` conflict (duplicate report / invalid
status transition), `422` past the daily-report grace period.
