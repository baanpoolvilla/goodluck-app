-- 0001_enums.sql
-- Enum types shared across tables.

create type user_role as enum ('admin', 'manager', 'employee');
create type task_priority as enum ('low', 'medium', 'high', 'critical');
create type task_status as enum (
  'pending',
  'in_progress',
  'completed',
  'completed_late',
  'overdue',
  'cancelled'
);
create type grade_module as enum ('task', 'daily_report');
