import { z } from "zod";

export const leaveTypeEnum = z.enum(["day_off", "vacation", "sick", "personal", "unpaid", "other"]);

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
  .pipe(z.coerce.date());

export const createLeaveSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    start_date: dateOnly,
    end_date: dateOnly,
    leave_type: leaveTypeEnum.default("vacation"),
    reason: z.string().max(2000).optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น",
    path: ["end_date"],
  });

export const updateLeaveSchema = z
  .object({
    start_date: dateOnly.optional(),
    end_date: dateOnly.optional(),
    leave_type: leaveTypeEnum.optional(),
    reason: z.string().max(2000).optional(),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น",
    path: ["end_date"],
  });

export const leaveListQuerySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
});
