import { z } from "zod";
import { reportChannelSchema } from "@/lib/reports/channels";

export const createReportSchema = z.object({
  content: z.string().min(1, "กรุณากรอกเนื้อหารายงาน").max(10000),
  report_date: z.coerce.date().optional(),
});

export const reportListQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  user_id: z.string().uuid().optional(),
  channel: reportChannelSchema.optional(),
});

export const reportCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export const reportReactionSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});
