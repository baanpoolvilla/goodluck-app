-- 0009_report_channels.sql
-- Turns Daily Report into a per-department channel feed (IT / Marketing /
-- Admin / Housekeeper) with comments + emoji reactions. Additive only —
-- 0001-0008 are untouched. See docs/rls-policy-matrix.md for the matrix.
--
-- Idempotent: every statement is safe to re-run. Paste the whole file into
-- the SQL Editor and run it as one query — if an earlier attempt only
-- partially completed (e.g. only part of the file got selected/run), running
-- this in full again will finish the rest without erroring on the pieces
-- that already exist.

do $$ begin
  create type report_channel as enum ('it', 'marketing', 'admin', 'housekeeper');
exception when duplicate_object then null;
end $$;

-- users.channel ------------------------------------------------------------
-- Nullable: unassigned until an admin sets it from /settings/users. A user
-- with no channel can't post/see the feed yet (enforced in the API routes).
alter table public.users add column if not exists channel report_channel;

-- daily_reports.channel ------------------------------------------------------
-- Snapshot of the author's channel at submit time, so a post's channel is
-- stable even if the author is later reassigned. Added nullable, backfilled,
-- then locked to not null — safe whether or not the table already has rows.
alter table public.daily_reports add column if not exists channel report_channel;
update public.daily_reports set channel = 'admin' where channel is null;
alter table public.daily_reports alter column channel set not null;

-- report_comments -----------------------------------------------------------
create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- report_reactions ------------------------------------------------------------
create table if not exists public.report_reactions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  -- one row per (report, user, emoji) so adding the same reaction twice is a no-op / toggle
  unique (report_id, user_id, emoji)
);

-- indexes ---------------------------------------------------------------------
create index if not exists idx_daily_reports_channel_date
  on public.daily_reports (channel, report_date desc);

create index if not exists idx_report_comments_report
  on public.report_comments (report_id);

create index if not exists idx_report_reactions_report
  on public.report_reactions (report_id);

-- helper: current user's channel, bypassing RLS (mirrors current_user_role()) ---
create or replace function public.current_user_channel()
returns report_channel as $$
  select channel from public.users where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- RLS ---------------------------------------------------------------------
alter table public.report_comments enable row level security;
alter table public.report_reactions enable row level security;

-- users: additive — existing "Users read own profile" and "Managers read
-- all profiles" (0006_rls.sql) are untouched. Without this, the feed's
-- embedded `author:users!user_id(...)` join (and the channel roster query)
-- would come back null/empty for every post except the viewer's own, since
-- employees otherwise have no policy letting them read a teammate's row.
drop policy if exists "Channel members read channel-mate profiles" on public.users;
create policy "Channel members read channel-mate profiles" on public.users
  for select using (
    channel is not null and channel = public.current_user_channel()
  );

-- daily_reports: additive — existing "Users manage own reports" (own row,
-- all commands) and "Managers read all reports" from 0006_rls.sql are
-- untouched. This adds channel-mate visibility for SELECT.
drop policy if exists "Channel members read channel reports" on public.daily_reports;
create policy "Channel members read channel reports" on public.daily_reports
  for select using (
    channel = public.current_user_channel() or public.is_manager_or_admin()
  );

-- report_comments -----------------------------------------------------------
drop policy if exists "Channel members read comments" on public.report_comments;
create policy "Channel members read comments" on public.report_comments
  for select using (
    exists (
      select 1 from public.daily_reports r
      where r.id = report_id
        and (r.channel = public.current_user_channel() or public.is_manager_or_admin())
    )
  );

drop policy if exists "Channel members write comments" on public.report_comments;
create policy "Channel members write comments" on public.report_comments
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.daily_reports r
      where r.id = report_id
        and (r.channel = public.current_user_channel() or public.is_manager_or_admin())
    )
  );

-- report_reactions ------------------------------------------------------------
drop policy if exists "Channel members read reactions" on public.report_reactions;
create policy "Channel members read reactions" on public.report_reactions
  for select using (
    exists (
      select 1 from public.daily_reports r
      where r.id = report_id
        and (r.channel = public.current_user_channel() or public.is_manager_or_admin())
    )
  );

drop policy if exists "Channel members add reactions" on public.report_reactions;
create policy "Channel members add reactions" on public.report_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.daily_reports r
      where r.id = report_id
        and (r.channel = public.current_user_channel() or public.is_manager_or_admin())
    )
  );

drop policy if exists "Users remove own reactions" on public.report_reactions;
create policy "Users remove own reactions" on public.report_reactions
  for delete using (user_id = auth.uid());

-- realtime ------------------------------------------------------------------
-- daily_reports is already published (0008_realtime.sql).
do $$ begin
  alter publication supabase_realtime add table public.report_comments;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.report_reactions;
exception when duplicate_object then null;
end $$;
