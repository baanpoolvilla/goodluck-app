// Schedule: 1st of every month at 02:00.
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { pushLineMessage, monthlyGradeSummaryTemplate } from "../_shared/line.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";

function previousMonthStart(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prev.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const supabase = createAdminClient();
  const targetMonth = previousMonthStart();

  const { data: activeUsers, error } = await supabase
    .from("users")
    .select("id, line_user_id")
    .eq("is_active", true);

  if (error) {
    console.error(JSON.stringify({ fn: "monthly-grade-calculator", error: error.message }));
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let calculated = 0;
  let notified = 0;

  for (const user of activeUsers ?? []) {
    const { error: calcError } = await supabase.rpc("calculate_monthly_grade", {
      p_user_id: user.id,
      p_month: targetMonth,
    });

    if (calcError) {
      console.error(JSON.stringify({ fn: "monthly-grade-calculator", userId: user.id, error: calcError.message }));
      continue;
    }
    calculated++;

    const { data: grade } = await supabase
      .from("monthly_grades")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", targetMonth)
      .maybeSingle();

    if (!grade) continue;

    const ok = await pushLineMessage(
      user.line_user_id,
      monthlyGradeSummaryTemplate(
        targetMonth,
        grade.task_score,
        grade.report_score,
        grade.total_score ?? 0,
        grade.grade ?? "-",
        `${APP_URL}/grades`
      )
    );
    if (ok) notified++;
  }

  const result = { fn: "monthly-grade-calculator", month: targetMonth, calculated, notified };
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
