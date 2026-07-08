import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TeamReportsPage() {
  const session = await getSessionUser();
  if (!session || !isManagerOrAdmin(session.profile)) redirect("/reports");

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const [{ data: activeUsers }, { data: reports }] = await Promise.all([
    supabase.from("users").select("id, full_name, department").eq("is_active", true).order("full_name"),
    supabase.from("daily_reports").select("*").eq("report_date", today),
  ]);

  const reportByUser = new Map((reports ?? []).map((r) => [r.user_id, r]));
  const total = activeUsers?.length ?? 0;
  const submitted = reports?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Report — ทีม</h1>
          <p className="text-sm text-muted-foreground">สถานะวันนี้ ({format(new Date(), "d MMM yyyy")})</p>
        </div>
        <div className="gradient-primary flex items-center gap-1.5 self-start rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-primary/25 sm:self-auto">
          {submitted}/{total} ลงแล้ว
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(activeUsers ?? []).map((u) => {
          const report = reportByUser.get(u.id);
          return (
            <div key={u.id} className="card-hover flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <Avatar className="size-10">
                <AvatarFallback className="gradient-primary text-xs font-semibold text-white">
                  {initialsOf(u.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.department ?? "-"}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    !report && "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                    report?.is_late &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                    report &&
                      !report.is_late &&
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  )}
                >
                  {!report ? "ยังไม่ลง" : report.is_late ? "ลงสาย" : "ลงแล้ว"}
                </span>
                {report && (
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(report.submitted_at), "HH:mm")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
