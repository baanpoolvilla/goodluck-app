import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/db/database.types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังทำ",
  completed: "เสร็จแล้ว",
  completed_late: "เสร็จ (สาย)",
  overdue: "เลยกำหนด",
  cancelled: "ยกเลิก",
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  completed_late: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
