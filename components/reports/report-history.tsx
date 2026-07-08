import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/lib/db/database.types";

type Report = Database["public"]["Tables"]["daily_reports"]["Row"];

export function ReportHistory({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีประวัติในเดือนนี้</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-start justify-between gap-4 pt-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium">{format(new Date(r.report_date), "d MMM yyyy")}</span>
                {r.is_late && <Badge variant="secondary">สาย</Badge>}
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: r.content }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
