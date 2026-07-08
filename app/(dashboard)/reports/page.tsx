import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { ReportSubmitForm } from "@/components/reports/report-submit-form";
import { ReportHistory } from "@/components/reports/report-history";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";

  const supabase = await createClient();
  const [{ data: todayReport }, { data: history }] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", session.id)
      .eq("report_date", today)
      .maybeSingle(),
    supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", session.id)
      .gte("report_date", monthStart)
      .order("report_date", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Daily Report</h1>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-medium">วันนี้</h2>
          {todayReport?.is_late && <Badge variant="secondary">ลงสาย</Badge>}
          {todayReport && !todayReport.is_late && <Badge>ลงแล้ว</Badge>}
        </div>

        {todayReport ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4"
            dangerouslySetInnerHTML={{ __html: todayReport.content }}
          />
        ) : (
          <ReportSubmitForm />
        )}
      </div>

      <div>
        <h2 className="mb-2 font-medium">ประวัติเดือนนี้</h2>
        <ReportHistory reports={history ?? []} />
      </div>
    </div>
  );
}
