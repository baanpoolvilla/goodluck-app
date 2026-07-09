-- 0010_leaves.sql
-- Employee leave/day-off calendar (spec: everyone can see everyone's leave
-- details; an employee manages their own entries, manager/admin manage any).
-- Additive only — 0001-0009 are untouched. Idempotent, same style as
-- 0009_report_channels.sql: safe to paste into the SQL Editor and re-run.

do $$ begin
  create type leave_type as enum ('vacation', 'sick', 'personal', 'unpaid', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type leave_type not null default 'vacation',
  reason text,
  -- who filed the entry — usually = user_id, differs when a manager/admin
  -- adds a leave on behalf of someone else.
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leaves_date_range_check check (end_date >= start_date)
);

create index if not exists idx_leaves_user_start on public.leaves (user_id, start_date);
create index if not exists idx_leaves_date_range on public.leaves (start_date, end_date);

drop trigger if exists trg_leaves_updated_at on public.leaves;
create trigger trg_leaves_updated_at
  before update on public.leaves
  for each row execute function public.set_updated_at();

-- RLS -----------------------------------------------------------------------
alter table public.leaves enable row level security;

-- Every authenticated user can see every leave entry with full detail (who,
-- when, type, reason) — this is a shared team calendar, not a private log.
drop policy if exists "Everyone reads all leaves" on public.leaves;
create policy "Everyone reads all leaves" on public.leaves
  for select using (true);

drop policy if exists "Users manage own leaves" on public.leaves;
create policy "Users manage own leaves" on public.leaves
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Managers manage any leave" on public.leaves;
create policy "Managers manage any leave" on public.leaves
  for all using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());
