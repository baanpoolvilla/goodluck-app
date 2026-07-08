import { z } from "zod";

export const taskPriorityEnum = z.enum(["low", "medium", "high", "critical"]);
export const taskStatusEnum = z.enum([
  "pending",
  "in_progress",
  "completed",
  "completed_late",
  "overdue",
  "cancelled",
]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่องาน").max(200),
  description: z.string().max(5000).optional(),
  assigned_to: z.string().uuid(),
  priority: taskPriorityEnum.default("medium"),
  deadline: z.coerce.date(),
  grade_weight: z.coerce.number().min(0.1).max(5).default(1),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  deadline: z.coerce.date().optional(),
  grade_weight: z.coerce.number().min(0.1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

export const taskCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const taskListQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  assigned_to: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

/** Valid forward transitions for task.status (spec section 5.1 flow diagram). */
export const TASK_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  overdue: ["completed_late", "cancelled"],
  completed: [],
  completed_late: [],
  cancelled: [],
};

export function isValidTaskTransition(from: string, to: string) {
  if (from === to) return true;
  return TASK_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
