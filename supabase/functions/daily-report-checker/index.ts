// Schedule (via pg_cron, see docs/runbook-cron-and-line.md):
//   20:00 Mon-Fri  -> POST { "phase": "remind" }
//   20:30 Mon-Fri  -> POST { "phase": "penalize" }
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { pushLineMessage, dailyReportReminderTemplate } from "../_shared/line.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";

Deno.serve(async (req) => {
  const { phase } = await req.json().catch(() => ({ phase: "remind" }));
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: activeUsers, error: usersError } = await supabase
    .from("users")
    .select("id, line_user_id")
    .eq("is_active", true);

  if (usersError) {
    console.error(JSON.stringify({ fn: "daily-report-checker", phase, error: usersError.message }));
    return new Response(JSON.stringify({ error: usersError.message }), { status: 500 });
  }

  const { data: submitted, error: reportsError } = await supabase
    .from("daily_reports")
    .select("user_id")
    .eq("report_date", today);

  if (reportsError) {
    console.error(JSON.stringify({ fn: "daily-report-checker", phase, error: reportsError.message }));
    return new Response(JSON.stringify({ error: reportsError.message }), { status: 500 });
  }

  const submittedIds = new Set((submitted ?? []).map((r) => r.user_id));
  const missing = (activeUsers ?? []).filter((u) => !submittedIds.has(u.id));

  let notified = 0;
  let penalized = 0;

  for (const user of missing) {
    if (phase === "remind") {
      const ok = await pushLineMessage(
        user.line_user_id,
        dailyReportReminderTemplate(`${APP_URL}/reports`)
      );
      if (ok) notified++;
    } else {
      const { error: penaltyError } = await supabase.rpc("apply_daily_report_penalty", {
        p_user_id: user.id,
        p_date: today,
        p_missed: true,
      });
      if (penaltyError) {
        console.error(
          JSON.stringify({ fn: "daily-report-checker", phase, userId: user.id, error: penaltyError.message })
        );
        continue;
      }
      penalized++;
    }
  }

  const result = { fn: "daily-report-checker", phase, checked: activeUsers?.length ?? 0, missing: missing.length, notified, penalized };
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
