-- 0002_tables.sql
-- Core table definitions. See docs/api-contract.md for shape used by the app.

create extension if not exists pgcrypto;

-- users -----------------------------------------------------------------
-- Mirrors auth.users (1:1), extended with app-level profile/role data.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role user_role not null default 'employee',
  line_user_id text,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tasks -------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid not null references public.users (id) on delete cascade,
  assigned_by uuid not null references public.users (id) on delete set null,
  priority task_priority not null default 'medium',
  status task_status not null default 'pending',
  deadline timestamptz not null,
  completed_at timestamptz,
  penalty_applied decimal(5, 2) not null default 0,
  grade_weight decimal(3, 2) not null default 1.0,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- task_comments -------------------------------------------------------------
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- daily_reports ---------------------------------------------------------
create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  report_date date not null,
  content text not null,
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, report_date)
);

-- grade_configs -----------------------------------------------------------
create table public.grade_configs (
  id uuid primary key default gen_random_uuid(),
  module grade_module unique not null,
  weight_percent integer not null check (weight_percent between 0 and 100),
  penalty_per_day_late decimal(5, 2) not null default 5.0,
  penalty_per_missed decimal(5, 2) not null default 10.0,
  max_penalty_per_item decimal(5, 2) not null default 100.0,
  daily_report_deadline_hour integer not null default 20,
  grace_period_minutes integer not null default 30,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id)
);

-- penalty_logs --------------------------------------------------------------
create table public.penalty_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  module grade_module not null,
  reference_id uuid not null,
  penalty_amount decimal(5, 2) not null,
  reason text not null,
  penalty_date date not null,
  created_at timestamptz not null default now(),
  -- prevents the checker crons from double-penalizing the same
  -- task/report on a re-run (see docs/runbook-cron-and-line.md)
  unique (module, reference_id, penalty_date)
);

-- monthly_grades ------------------------------------------------------------
create table public.monthly_grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  month date not null,
  task_score decimal(5, 2) not null default 100,
  report_score decimal(5, 2) not null default 100,
  total_score decimal(5, 2),
  grade varchar(2),
  total_tasks integer not null default 0,
  completed_on_time integer not null default 0,
  total_report_days integer not null default 0,
  reports_submitted integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- app_hub_items -------------------------------------------------------------
create table public.app_hub_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  redirect_url text not null,
  allowed_roles text[] not null default array['admin', 'manager', 'employee'],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
