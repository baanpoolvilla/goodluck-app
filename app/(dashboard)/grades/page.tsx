import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { GradeHistoryTable } from "@/components/grades/grade-history-table";
import { PenaltyList } from "@/components/grades/penalty-list";

export default async function GradesPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const monthStart = new Date().toISOString().slice(0, 8) + "01";

  const supabase = await createClient();
  const [{ data: grades }, { data: penalties }] = await Promise.all([
    supabase
      .from("monthly_grades")
      .select("*")
      .eq("user_id", session.id)
      .order("month", { ascending: false })
      .limit(12),
    supabase
      .from("penalty_logs")
      .select("*")
      .eq("user_id", session.id)
      .gte("penalty_date", monthStart)
      .order("penalty_date", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">คะแนนของฉัน</h1>

      <GradeHistoryTable grades={grades ?? []} />

      <div>
        <h2 className="mb-2 font-medium">Penalty เดือนนี้</h2>
        <PenaltyList penalties={penalties ?? []} />
      </div>
    </div>
  );
}
