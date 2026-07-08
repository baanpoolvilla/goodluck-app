# RLS Policy Matrix

Source of truth: `supabase/migrations/0006_rls.sql`. Helper functions
`current_user_role()`, `is_manager_or_admin()`, `is_admin()` are
`SECURITY DEFINER` so policies on `users` itself don't recurse.

| Table | Employee | Manager | Admin |
|---|---|---|---|
| `users` | select/update own row | select all rows | select/update/delete all rows |
| `tasks` | select own (assignee or assigner); update own row's `status` only | select/insert/update/delete all | same as manager |
| `task_comments` | select/insert on tasks they participate in | select/insert on all tasks | same as manager |
| `daily_reports` | select/insert/update own rows only | + select all rows | same as manager |
| `grade_configs` | select all | select all | select/insert/update/delete |
| `penalty_logs` | select own rows | select all rows | select all rows — writes are service-role only (via `apply_task_penalty` / `apply_daily_report_penalty`, called from cron or admin API routes) |
| `monthly_grades` | select own rows | select all rows | select all rows — writes via `calculate_monthly_grade` (service-role only) |
| `app_hub_items` | select active items where `role() = any(allowed_roles)` | same as employee | select/insert/update/delete all (bypasses the active/role filter) |

Writes to `penalty_logs` and `monthly_grades` deliberately have no regular
user policy — every write goes through a Postgres function invoked with the
service-role key (cron Edge Functions, or the two admin-triggered API
routes), so the grading math can't be tampered with from the client.
