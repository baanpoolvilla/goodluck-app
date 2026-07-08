-- 0003_indexes.sql

create index idx_tasks_assigned_status_deadline
  on public.tasks (assigned_to, status, deadline);

create index idx_tasks_deadline_status
  on public.tasks (deadline)
  where status in ('pending', 'in_progress');

create index idx_daily_reports_user_date
  on public.daily_reports (user_id, report_date);

create index idx_penalty_logs_user_module_date
  on public.penalty_logs (user_id, module, penalty_date);

create index idx_monthly_grades_user_month
  on public.monthly_grades (user_id, month);

create index idx_task_comments_task
  on public.task_comments (task_id);
