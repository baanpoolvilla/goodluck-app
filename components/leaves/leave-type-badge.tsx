import { cn } from "@/lib/utils";
import type { LeaveType } from "@/lib/db/database.types";

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  vacation: "ลาพักร้อน",
  sick: "ลาป่วย",
  personal: "ลากิจ",
  unpaid: "ลาไม่รับเงินเดือน",
  other: "อื่นๆ",
};

export const LEAVE_TYPE_CLASSES: Record<LeaveType, string> = {
  vacation: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  sick: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  personal: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  unpaid: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  other: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export const LEAVE_TYPE_DOT: Record<LeaveType, string> = {
  vacation: "bg-sky-500",
  sick: "bg-rose-500",
  personal: "bg-amber-500",
  unpaid: "bg-slate-400",
  other: "bg-violet-500",
};

export function LeaveTypeBadge({ type }: { type: LeaveType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        LEAVE_TYPE_CLASSES[type]
      )}
    >
      {LEAVE_TYPE_LABEL[type]}
    </span>
  );
}
