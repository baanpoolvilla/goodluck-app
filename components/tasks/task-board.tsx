import { TaskCard } from "@/components/tasks/task-card";
import type { Database, TaskStatus } from "@/lib/db/database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
};

const COLUMNS: { key: string; label: string; statuses: TaskStatus[]; accent: string; dot: string }[] = [
  { key: "pending", label: "รอดำเนินการ", statuses: ["pending"], accent: "bg-amber-400", dot: "bg-amber-500" },
  {
    key: "in_progress",
    label: "กำลังทำ",
    statuses: ["in_progress"],
    accent: "bg-blue-400",
    dot: "bg-blue-500",
  },
  { key: "overdue", label: "เลยกำหนด", statuses: ["overdue"], accent: "bg-rose-400", dot: "bg-rose-500" },
  {
    key: "completed",
    label: "เสร็จแล้ว",
    statuses: ["completed", "completed_late"],
    accent: "bg-emerald-400",
    dot: "bg-emerald-500",
  },
];

export function TaskBoard({ tasks }: { tasks: TaskRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => col.statuses.includes(t.status));
        return (
          <div key={col.key} className="flex flex-col rounded-2xl bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
                {colTasks.length}
              </span>
            </div>

            <div className={`mb-3 h-1 rounded-full ${col.accent} opacity-60`} />

            <div className="flex flex-1 flex-col gap-2.5">
              {colTasks.length === 0 && (
                <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                  ไม่มีงาน
                </div>
              )}
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
