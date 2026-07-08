import { CheckCircle2, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { ReportSubmitForm } from "@/components/reports/report-submit-form";
import { ReportHistory } from "@/components/reports/report-history";

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Report</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
      </div>

      <div>
        {todayReport ? (
          <div className="overflow-hidden rounded-2xl border shadow-sm">
            <div
              className={
                todayReport.is_late
                  ? "flex items-center gap-2 bg-amber-500 px-5 py-3 text-white"
                  : "flex items-center gap-2 bg-emerald-500 px-5 py-3 text-white"
              }
            >
              {todayReport.is_late ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
              <span className="text-sm font-medium">
                {todayReport.is_late ? "ลงรายงานวันนี้แล้ว (สาย)" : "ลงรายงานวันนี้แล้ว ทันเวลา"}
              </span>
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none bg-card p-5"
              dangerouslySetInnerHTML={{ __html: todayReport.content }}
            />
          </div>
        ) : (
          <ReportSubmitForm />
        )}
      </div>

      <div>
        <h2 className="mb-3 font-medium">ประวัติเดือนนี้</h2>
        <ReportHistory reports={history ?? []} />
      </div>
    </div>
  );
}
