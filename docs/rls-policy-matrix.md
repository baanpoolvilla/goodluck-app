# RLS Policy Matrix

Source of truth: `supabase/migrations/0006_rls.sql` (+ `0009_report_channels.sql`
for the channel-feed additions below). Helper functions `current_user_role()`,
`is_manager_or_admin()`, `is_admin()`, `current_user_channel()` are
`SECURITY DEFINER` so policies on `users` itself don't recurse.

| Table | Employee | Manager | Admin |
|---|---|---|---|
| `users` | select/update own row; + select channel-mates' rows (needed for the feed's author/roster display) | select all rows | select/update/delete all rows |
| `tasks` | select own (assignee or assigner); update own row's `status` only | select/insert/update/delete all | same as manager |
| `task_comments` | select/insert on tasks they participate in | select/insert on all tasks | same as manager |
| `daily_reports` | select/insert/update own rows; + select all rows in their own `channel` | + select all rows (any channel) | same as manager |
| `report_comments` | select/insert where the parent report's `channel` matches their own | select/insert on any report's comments | same as manager |
| `report_reactions` | select/insert where the parent report's `channel` matches their own; delete own reactions only | select/insert on any report's reactions | same as manager |
| `grade_configs` | select all | select all | select/insert/update/delete |
| `penalty_logs` | select own rows | select all rows | select all rows — writes are service-role only (via `apply_task_penalty` / `apply_daily_report_penalty`, called from cron or admin API routes) |
| `monthly_grades` | select own rows | select all rows | select all rows — writes via `calculate_monthly_grade` (service-role only) |
| `app_hub_items` | select active items where `role() = any(allowed_roles)` | same as employee | select/insert/update/delete all (bypasses the active/role filter) |

Writes to `penalty_logs` and `monthly_grades` deliberately have no regular
user policy — every write goes through a Postgres function invoked with the
service-role key (cron Edge Functions, or the two admin-triggered API
routes), so the grading math can't be tampered with from the client.

`daily_reports.channel` is set server-side from the author's `users.channel`
at submit time (never taken from client input), so there's no separate RLS
check constraining its value on INSERT — the same trust boundary already
used for `is_late`/`submitted_at`.
