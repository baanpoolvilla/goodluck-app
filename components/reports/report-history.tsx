import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/db/database.types";

type Report = Database["public"]["Tables"]["daily_reports"]["Row"];

export function ReportHistory({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        ยังไม่มีประวัติในเดือนนี้
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div
          key={r.id}
          className={cn(
            "card-hover flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm",
            "border-l-4",
            r.is_late ? "border-l-amber-400" : "border-l-emerald-400"
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium">{format(new Date(r.report_date), "d MMM yyyy")}</span>
              {r.is_late && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  สาย
                </span>
              )}
            </div>
            <div
              className="prose prose-sm dark:prose-invert line-clamp-2 max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: r.content }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
