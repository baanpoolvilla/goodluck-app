-- seed.sql
-- Minimum seed data for local development (`supabase db reset` runs this
-- automatically after migrations). Passwords below are for local dev only.

-- 1 admin user -------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@company.local',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin"}'
)
on conflict (id) do nothing;

update public.users
set role = 'admin', full_name = 'System Admin', department = 'Management', channel = 'admin'
where id = '00000000-0000-0000-0000-000000000001';

-- 4 sample employees, one per report channel --------------------------------
-- Lets the IT/Marketing/Admin/Housekeeper channel feeds be exercised locally
-- without having to sign up new accounts by hand.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'it.staff@company.local',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Nan IT"}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'marketing.staff@company.local',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bee Marketing"}'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin.staff@company.local',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Nam Admin"}'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'housekeeper.staff@company.local',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Somporn Housekeeper"}'
  )
on conflict (id) do nothing;

update public.users set department = 'IT', channel = 'it'
where id = '00000000-0000-0000-0000-000000000002';
update public.users set department = 'Marketing', channel = 'marketing'
where id = '00000000-0000-0000-0000-000000000003';
update public.users set department = 'Admin', channel = 'admin'
where id = '00000000-0000-0000-0000-000000000004';
update public.users set department = 'Housekeeping', channel = 'housekeeper'
where id = '00000000-0000-0000-0000-000000000005';

-- grade_configs: task + report weights sum to 100% -------------------------
insert into public.grade_configs (
  module, weight_percent, penalty_per_day_late, penalty_per_missed,
  max_penalty_per_item, daily_report_deadline_hour, grace_period_minutes
) values
  ('task', 60, 5.0, 10.0, 100.0, 20, 30),
  ('daily_report', 40, 5.0, 10.0, 100.0, 20, 30)
on conflict (module) do nothing;

-- default app hub cards -----------------------------------------------------
insert into public.app_hub_items (
  name, description, icon_url, redirect_url, allowed_roles, sort_order
) values
  ('Baan Pool Villa Admin', 'ระบบจัดการที่พัก', null, 'https://admin.baanpoolvilla.com', array['admin', 'manager'], 1),
  ('ระบบถังแก๊ส', 'ระบบติดตามถังแก๊ส', null, 'https://gas.internal.com', array['admin', 'manager'], 2),
  ('Company Ops', 'ระบบนี้', null, '/', array['admin', 'manager', 'employee'], 0),
  ('n8n Workflows', 'ระบบ automation', null, 'https://n8n.internal.com', array['admin'], 3)
on conflict do nothing;
