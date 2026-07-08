-- 0006_rls.sql
-- Row Level Security policies. See docs/rls-policy-matrix.md for the
-- human-readable version of this matrix.

-- helper: current user's role, bypassing RLS to avoid recursive lookups
-- when policies on `users` itself need to know the caller's role.
create or replace function public.current_user_role()
returns user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function public.is_manager_or_admin()
returns boolean as $$
  select public.current_user_role() in ('manager', 'admin');
$$ language sql stable security definer set search_path = public;

create or replace function public.is_admin()
returns boolean as $$
  select public.current_user_role() = 'admin';
$$ language sql stable security definer set search_path = public;

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.daily_reports enable row level security;
alter table public.grade_configs enable row level security;
alter table public.penalty_logs enable row level security;
alter table public.monthly_grades enable row level security;
alter table public.app_hub_items enable row level security;

-- users -----------------------------------------------------------------
create policy "Users read own profile" on public.users
  for select using (id = auth.uid());

create policy "Managers read all profiles" on public.users
  for select using (public.is_manager_or_admin());

create policy "Users update own profile" on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins manage all profiles" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- tasks -------------------------------------------------------------------
create policy "Users see own tasks" on public.tasks
  for select using (assigned_to = auth.uid() or assigned_by = auth.uid());

create policy "Managers see all tasks" on public.tasks
  for select using (public.is_manager_or_admin());

create policy "Managers create tasks" on public.tasks
  for insert with check (public.is_manager_or_admin());

create policy "Assignee updates own task" on public.tasks
  for update using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Managers update any task" on public.tasks
  for update using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());

create policy "Managers delete tasks" on public.tasks
  for delete using (public.is_manager_or_admin());

-- task_comments ---------------------------------------------------------
create policy "Participants read comments" on public.task_comments
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.assigned_to = auth.uid() or t.assigned_by = auth.uid())
    )
    or public.is_manager_or_admin()
  );

create policy "Participants write comments" on public.task_comments
  for insert with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.tasks t
        where t.id = task_id
          and (t.assigned_to = auth.uid() or t.assigned_by = auth.uid())
      )
      or public.is_manager_or_admin()
    )
  );

-- daily_reports -----------------------------------------------------------
create policy "Users manage own reports" on public.daily_reports
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Managers read all reports" on public.daily_reports
  for select using (public.is_manager_or_admin());

-- grade_configs -------------------------------------------------------------
create policy "Everyone reads grade config" on public.grade_configs
  for select using (true);

create policy "Admins manage grade config" on public.grade_configs
  for all using (public.is_admin()) with check (public.is_admin());

-- penalty_logs --------------------------------------------------------------
create policy "Users read own penalties" on public.penalty_logs
  for select using (user_id = auth.uid());

create policy "Managers read all penalties" on public.penalty_logs
  for select using (public.is_manager_or_admin());

-- writes to penalty_logs happen via SECURITY DEFINER functions /
-- service-role cron jobs only — no INSERT/UPDATE policy for regular users.

-- monthly_grades ------------------------------------------------------------
create policy "Users read own grades" on public.monthly_grades
  for select using (user_id = auth.uid());

create policy "Managers read all grades" on public.monthly_grades
  for select using (public.is_manager_or_admin());

-- app_hub_items ---------------------------------------------------------
create policy "Users read allowed hub items" on public.app_hub_items
  for select using (
    is_active
    and public.current_user_role()::text = any (allowed_roles)
  );

create policy "Admins manage hub items" on public.app_hub_items
  for all using (public.is_admin()) with check (public.is_admin());
