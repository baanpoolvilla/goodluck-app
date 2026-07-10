-- 0011_leaves_add_day_off.sql
-- Add a "day_off" leave_type value (plain weekly day off, distinct from
-- ลาพักร้อน/vacation leave). Additive only — safe to paste into the SQL
-- Editor and re-run.

alter type leave_type add value if not exists 'day_off' before 'vacation';
