import Link from "next/link";
import { format, isPast } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityDot } from "@/components/tasks/priority-badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/db/database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TaskCard({ task }: { task: TaskRow }) {
  const deadline = new Date(task.deadline);
  const overdue = task.status !== "completed" && task.status !== "completed_late" && isPast(deadline);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="card-hover block rounded-xl border bg-card p-3.5 shadow-sm hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-card-foreground">{task.title}</p>
        {task.penalty_applied > 0 && (
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3" />-{task.penalty_applied}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <PriorityDot priority={task.priority} />
        <span
          className={cn(
            "flex items-center gap-1 text-[11px]",
            overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted-foreground"
          )}
        >
          <Clock className="size-3" />
          {format(deadline, "d MMM")}
        </span>
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 border-t pt-2.5">
          <Avatar className="size-5">
            <AvatarFallback className="gradient-primary text-[9px] font-semibold text-white">
              {initialsOf(task.assignee.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">{task.assignee.full_name}</span>
        </div>
      )}
    </Link>
  );
}
