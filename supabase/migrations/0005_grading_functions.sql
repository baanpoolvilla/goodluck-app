-- 0005_grading_functions.sql
-- Penalty engine + monthly grading engine (spec sections 4.3, 5.1, 5.2, 16.2.D).

-- apply_task_penalty ---------------------------------------------------------
-- Idempotent: safe to re-run for the same task/day, the unique key on
-- penalty_logs(module, reference_id, penalty_date) absorbs duplicates.
create or replace function public.apply_task_penalty(p_task_id uuid)
returns void as $$
declare
  v_task record;
  v_config record;
  v_days_late integer;
  v_penalty decimal(5, 2);
begin
  select * into v_task from public.tasks where id = p_task_id;
  if v_task is null or v_task.status not in ('overdue', 'completed_late') then
    return;
  end if;

  select * into v_config from public.grade_configs where module = 'task';

  v_days_late := greatest(1, (current_date - v_task.deadline::date));

  v_penalty := least(
    v_days_late * v_config.penalty_per_day_late * v_task.grade_weight,
    v_config.max_penalty_per_item
  );

  insert into public.penalty_logs (
    user_id, module, reference_id, penalty_amount, reason, penalty_date
  ) values (
    v_task.assigned_to,
    'task',
    v_task.id,
    v_penalty,
    format('Task "%s" สาย %s วัน', v_task.title, v_days_late),
    current_date
  )
  on conflict (module, reference_id, penalty_date) do update set
    penalty_amount = excluded.penalty_amount,
    reason = excluded.reason;

  update public.tasks set penalty_applied = v_penalty where id = p_task_id;
end;
$$ language plpgsql;

-- apply_daily_report_penalty -------------------------------------------------
create or replace function public.apply_daily_report_penalty(
  p_user_id uuid,
  p_date date,
  p_missed boolean
)
returns void as $$
declare
  v_config record;
  v_penalty decimal(5, 2);
  v_reason text;
begin
  select * into v_config from public.grade_configs where module = 'daily_report';

  if p_missed then
    v_penalty := v_config.penalty_per_missed;
    v_reason := 'ไม่ได้ลง Daily Report';
  else
    v_penalty := v_config.penalty_per_missed * 0.5;
    v_reason := 'ลง Daily Report สาย';
  end if;

  insert into public.penalty_logs (
    user_id, module, reference_id, penalty_amount, reason, penalty_date
  ) values (
    p_user_id,
    'daily_report',
    -- daily_reports has no row when missed entirely, so key the penalty
    -- log off a deterministic per-user-per-day uuid instead of a real FK.
    md5(p_user_id::text || p_date::text)::uuid,
    v_penalty,
    v_reason,
    p_date
  )
  on conflict (module, reference_id, penalty_date) do update set
    penalty_amount = excluded.penalty_amount,
    reason = excluded.reason;
end;
$$ language plpgsql;

-- calculate_monthly_grade -----------------------------------------------------
create or replace function public.calculate_monthly_grade(
  p_user_id uuid,
  p_month date
) returns void as $$
declare
  v_task_weight integer;
  v_report_weight integer;
  v_task_score decimal(5, 2) := 100;
  v_report_score decimal(5, 2) := 100;
  v_total_score decimal(5, 2);
  v_grade varchar(2);
  v_total_tasks integer;
  v_on_time integer;
  v_total_report_days integer;
  v_reports_submitted integer;
  v_task_penalties decimal;
  v_report_penalties decimal;
  v_month_start date := date_trunc('month', p_month)::date;
begin
  select weight_percent into v_task_weight
    from public.grade_configs where module = 'task';
  select weight_percent into v_report_weight
    from public.grade_configs where module = 'daily_report';

  select
    count(*),
    count(*) filter (where status in ('completed') and completed_at <= deadline)
  into v_total_tasks, v_on_time
  from public.tasks
  where assigned_to = p_user_id
    and date_trunc('month', deadline) = v_month_start;

  select coalesce(sum(penalty_amount), 0)
  into v_task_penalties
  from public.penalty_logs
  where user_id = p_user_id
    and module = 'task'
    and date_trunc('month', penalty_date) = v_month_start;

  v_task_score := greatest(0, 100 - v_task_penalties);

  select count(*)
  into v_total_report_days
  from generate_series(
    v_month_start,
    (v_month_start + interval '1 month - 1 day')::date,
    '1 day'
  ) d
  where extract(dow from d) between 1 and 5;

  select count(*)
  into v_reports_submitted
  from public.daily_reports
  where user_id = p_user_id
    and date_trunc('month', report_date) = v_month_start;

  select coalesce(sum(penalty_amount), 0)
  into v_report_penalties
  from public.penalty_logs
  where user_id = p_user_id
    and module = 'daily_report'
    and date_trunc('month', penalty_date) = v_month_start;

  v_report_score := greatest(0, 100 - v_report_penalties);

  v_total_score := (v_task_score * v_task_weight / 100.0)
                  + (v_report_score * v_report_weight / 100.0);

  v_grade := case
    when v_total_score >= 90 then 'A'
    when v_total_score >= 80 then 'B'
    when v_total_score >= 70 then 'C'
    when v_total_score >= 60 then 'D'
    else 'F'
  end;

  insert into public.monthly_grades (
    id, user_id, month, task_score, report_score,
    total_score, grade, total_tasks, completed_on_time,
    total_report_days, reports_submitted
  ) values (
    gen_random_uuid(), p_user_id, v_month_start, v_task_score, v_report_score,
    v_total_score, v_grade, v_total_tasks, v_on_time,
    v_total_report_days, v_reports_submitted
  )
  on conflict (user_id, month) do update set
    task_score = excluded.task_score,
    report_score = excluded.report_score,
    total_score = excluded.total_score,
    grade = excluded.grade,
    total_tasks = excluded.total_tasks,
    completed_on_time = excluded.completed_on_time,
    total_report_days = excluded.total_report_days,
    reports_submitted = excluded.reports_submitted;
end;
$$ language plpgsql;
