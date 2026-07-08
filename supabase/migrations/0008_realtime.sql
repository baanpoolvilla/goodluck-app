-- 0008_realtime.sql
-- Dashboard realtime widgets (spec section 5.3) subscribe to these tables.

alter publication supabase_realtime add table public.daily_reports;
alter publication supabase_realtime add table public.penalty_logs;
alter publication supabase_realtime add table public.tasks;
