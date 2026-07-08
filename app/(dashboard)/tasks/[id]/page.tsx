import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, UserCheck, Gauge, AlertTriangle } from "lucide-react";
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

  const infoItems = [
    { icon: User, label: "ผู้รับผิดชอบ", value: task.assignee?.full_name ?? "-" },
    { icon: UserCheck, label: "มอบหมายโดย", value: task.assigner?.full_name ?? "-" },
    { icon: Calendar, label: "กำหนดส่ง", value: format(new Date(task.deadline), "d MMM yyyy HH:mm") },
    { icon: Gauge, label: "น้ำหนักคะแนน", value: String(task.grade_weight) },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        กลับไปที่ Tasks
      </Link>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="gradient-primary p-5">
          <h1 className="text-xl font-semibold text-white">{task.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.penalty_applied > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                <AlertTriangle className="size-3" />
                -{task.penalty_applied} คะแนน
              </span>
            )}
          </div>
        </div>

        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-sm font-medium">{item.value}</div>
              </div>
            </div>
          ))}
          {task.description && (
            <div className="sm:col-span-2">
              <div className="mb-1 text-xs text-muted-foreground">รายละเอียด</div>
              <p className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </CardContent>
      </div>

      <TaskStatusActions taskId={task.id} status={task.status} />

      <Card>
        <CardContent className="pt-6">
          <TaskComments taskId={task.id} comments={comments ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
