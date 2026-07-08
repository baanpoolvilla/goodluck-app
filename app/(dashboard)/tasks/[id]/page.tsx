import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TaskStatusActions } from "@/components/tasks/task-status-actions";
import { TaskComments } from "@/components/tasks/task-comments";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) return null;

  const supabase = await createClient();

  const [{ data: task }, { data: comments }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assignee:users!assigned_to(id, full_name), assigner:users!assigned_by(id, full_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("task_comments")
      .select("*, author:users!user_id(id, full_name)")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!task) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.penalty_applied > 0 && (
            <span className="text-sm text-destructive">-{task.penalty_applied} คะแนน</span>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">ผู้รับผิดชอบ</div>
            <div>{task.assignee?.full_name ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">มอบหมายโดย</div>
            <div>{task.assigner?.full_name ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">กำหนดส่ง</div>
            <div>{format(new Date(task.deadline), "d MMM yyyy HH:mm")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">น้ำหนักคะแนน</div>
            <div>{task.grade_weight}</div>
          </div>
          {task.description && (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">รายละเอียด</div>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskStatusActions taskId={task.id} status={task.status} />

      <TaskComments taskId={task.id} comments={comments ?? []} />
    </div>
  );
}
