// Schedule: every day at 09:00.
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { pushLineMessage, taskReminderTemplate } from "../_shared/line.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";

Deno.serve(async () => {
  const supabase = createAdminClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, deadline, users:users!assigned_to(full_name, line_user_id), assigner:users!assigned_by(full_name)")
    .in("status", ["pending", "in_progress"])
    .gte("deadline", now.toISOString())
    .lte("deadline", in24h.toISOString());

  if (error) {
    console.error(JSON.stringify({ fn: "task-reminder-24h", error: error.message }));
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let notified = 0;

  for (const task of tasks ?? []) {
    const assignee = (task as unknown as { users: { full_name: string; line_user_id: string | null } }).users;
    const assigner = (task as unknown as { assigner: { full_name: string } }).assigner;

    const ok = await pushLineMessage(
      assignee?.line_user_id,
      taskReminderTemplate(task.title, task.deadline, assigner?.full_name ?? "-", `${APP_URL}/tasks/${task.id}`)
    );
    if (ok) notified++;
  }

  const result = { fn: "task-reminder-24h", found: tasks?.length ?? 0, notified };
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
