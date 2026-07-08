import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/db/database.types";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "ต่ำ",
  medium: "กลาง",
  high: "สูง",
  critical: "วิกฤต",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-slate-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  critical: "bg-rose-500",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PRIORITY_CLASSES[priority]
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[priority])} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
