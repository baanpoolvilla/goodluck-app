// Schedule: every hour, all days (see docs/runbook-cron-and-line.md).
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { pushLineMessage, taskOverdueTemplate } from "../_shared/line.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";

Deno.serve(async () => {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: overdueTasks, error } = await supabase
    .from("tasks")
    .select("id, title, assigned_to, deadline, grade_weight, users:users!assigned_to(line_user_id)")
    .in("status", ["pending", "in_progress"])
    .lt("deadline", nowIso);

  if (error) {
    console.error(JSON.stringify({ fn: "task-deadline-checker", error: error.message }));
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let updated = 0;
  let notified = 0;

  for (const task of overdueTasks ?? []) {
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: "overdue" })
      .eq("id", task.id)
      .in("status", ["pending", "in_progress"]);

    if (updateError) {
      console.error(JSON.stringify({ fn: "task-deadline-checker", taskId: task.id, error: updateError.message }));
      continue;
    }
    updated++;

    const { error: penaltyError } = await supabase.rpc("apply_task_penalty", { p_task_id: task.id });
    if (penaltyError) {
      console.error(JSON.stringify({ fn: "task-deadline-checker", taskId: task.id, error: penaltyError.message }));
      continue;
    }

    const daysLate = Math.max(
      1,
      Math.floor((Date.now() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24))
    );
    const { data: penaltyRow } = await supabase
      .from("penalty_logs")
      .select("penalty_amount")
      .eq("module", "task")
      .eq("reference_id", task.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lineUserId = (task as unknown as { users: { line_user_id: string | null } }).users?.line_user_id;
    const ok = await pushLineMessage(
      lineUserId,
      taskOverdueTemplate(task.title, daysLate, penaltyRow?.penalty_amount ?? 0, `${APP_URL}/tasks/${task.id}`)
    );
    if (ok) notified++;
  }

  const result = { fn: "task-deadline-checker", found: overdueTasks?.length ?? 0, updated, notified };
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
