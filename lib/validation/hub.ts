import { z } from "zod";

export const hubItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon_url: z.string().url().optional().or(z.literal("")),
  redirect_url: z.string().min(1),
  allowed_roles: z.array(z.enum(["admin", "manager", "employee"])).min(1),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const gradeConfigSchema = z.object({
  weight_percent: z.coerce.number().int().min(0).max(100),
  penalty_per_day_late: z.coerce.number().min(0),
  penalty_per_missed: z.coerce.number().min(0),
  max_penalty_per_item: z.coerce.number().min(0),
  daily_report_deadline_hour: z.coerce.number().int().min(0).max(23),
  grace_period_minutes: z.coerce.number().int().min(0).max(180),
  is_active: z.boolean().default(true),
});
