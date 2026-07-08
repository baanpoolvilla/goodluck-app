-- 0007_cron_jobs.sql
-- Wires the Edge Functions in supabase/functions/* to pg_cron via pg_net.
--
-- IMPORTANT: replace the two placeholders below before applying this
-- migration against a real project (see docs/runbook-cron-and-line.md):
--   <PROJECT_REF>          - your Supabase project ref
--   <SERVICE_ROLE_JWT>     - service_role key, stored via Vault ideally
--
-- Safe to skip entirely in local dev — the Edge Functions can be invoked
-- manually with `supabase functions invoke <name>` for testing.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-report-remind',
  '0 20 * * 1-5',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/daily-report-checker',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>', 'Content-Type', 'application/json'),
    body := jsonb_build_object('phase', 'remind')
  );
  $$
);

select cron.schedule(
  'daily-report-penalize',
  '30 20 * * 1-5',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/daily-report-checker',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>', 'Content-Type', 'application/json'),
    body := jsonb_build_object('phase', 'penalize')
  );
  $$
);

select cron.schedule(
  'task-deadline-checker',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/task-deadline-checker',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'monthly-grade-calculator',
  '0 2 1 * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/monthly-grade-calculator',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'task-reminder-24h',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/task-reminder-24h',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_JWT>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
