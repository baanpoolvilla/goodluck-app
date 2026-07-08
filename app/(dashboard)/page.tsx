import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { ScoreCard } from "@/components/dashboard/score-card";
import { TaskOverview } from "@/components/dashboard/task-overview";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { DashboardRealtime, type ReportStatusEntry } from "@/components/dashboard/dashboard-realtime";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart-lazy";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const canSeeTeam = isManagerOrAdmin(session.profile);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  const supabase = await createClient();

  const [
    { data: myGrade },
    { data: myTasks },
    { data: leaderboardGrades },
    { data: trendGrades },
    { data: activeUsers },
    { data: todayReports },
    { data: recentPenalties },
  ] = await Promise.all([
    supabase.from("monthly_grades").select("*").eq("user_id", session.id).eq("month", monthStart).maybeSingle(),
    supabase.from("tasks").select("status").eq("assigned_to", session.id),
    supabase
      .from("monthly_grades")
      .select("*, user:users!user_id(id, full_name)")
      .eq("month", monthStart)
      .order("total_score", { ascending: false })
      .limit(10),
    supabase
      .from("monthly_grades")
      .select("month, total_score")
      .eq("user_id", session.id)
      .gte("month", sixMonthsAgo.toISOString().slice(0, 10))
      .order("month", { ascending: true }),
    canSeeTeam
      ? supabase.from("users").select("id, full_name").eq("is_active", true).order("full_name")
      : Promise.resolve({ data: null }),
    canSeeTeam
      ? supabase.from("daily_reports").select("*").eq("report_date", today)
      : Promise.resolve({ data: null }),
    supabase
      .from("penalty_logs")
      .select("*, user:users!user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const taskCounts = { pending: 0, in_progress: 0, overdue: 0, completed: 0 };
  for (const t of myTasks ?? []) {
    if (t.status === "pending") taskCounts.pending++;
    else if (t.status === "in_progress") taskCounts.in_progress++;
    else if (t.status === "overdue") taskCounts.overdue++;
    else if (t.status === "completed" || t.status === "completed_late") taskCounts.completed++;
  }

  const leaderboardEntries = (leaderboardGrades ?? []).map((g) => ({
    userId: g.user_id,
    fullName: (g as unknown as { user: { full_name: string } }).user?.full_name ?? "-",
    totalScore: g.total_score ?? 0,
    grade: g.grade ?? "-",
  }));

  const reportByUser = new Map((todayReports ?? []).map((r) => [r.user_id, r]));
  const reportStatus: ReportStatusEntry[] = (activeUsers ?? []).map((u) => {
    const r = reportByUser.get(u.id);
    return { userId: u.id, fullName: u.full_name, submittedAt: r?.submitted_at ?? null, isLate: r?.is_late ?? false };
  });

  const userNames = Object.fromEntries((activeUsers ?? []).map((u) => [u.id, u.full_name]));
  const penaltiesWithNames = (recentPenalties ?? []).map((p) => ({
    ...p,
    userName: (p as unknown as { user: { full_name: string } }).user?.full_name ?? "-",
  }));

  const trendData = (trendGrades ?? []).map((g) => ({
    month: format(new Date(g.month), "MMM"),
    total_score: g.total_score ?? 0,
  }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ScoreCard totalScore={myGrade?.total_score ?? null} grade={myGrade?.grade ?? null} />
        <TaskOverview counts={taskCounts} />
        <Leaderboard entries={leaderboardEntries} />
      </div>

      <DashboardRealtime
        today={today}
        initialReportStatus={reportStatus}
        initialPenalties={penaltiesWithNames}
        userNames={userNames}
        canSeeTeam={canSeeTeam}
      />

      <MonthlyTrendChart data={trendData} />
    </div>
  );
}
