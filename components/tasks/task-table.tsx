import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import type { Database } from "@/lib/db/database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
};

export function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
        ไม่พบงาน
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>งาน</TableHead>
            <TableHead>ผู้รับผิดชอบ</TableHead>
            <TableHead>ความสำคัญ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>กำหนดส่ง</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <Link href={`/tasks/${task.id}`} className="hover:underline">
                  {task.title}
                </Link>
              </TableCell>
              <TableCell>{task.assignee?.full_name ?? "-"}</TableCell>
              <TableCell>
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell>{format(new Date(task.deadline), "d MMM yyyy HH:mm")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
