import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Daily Report — ทีม</h1>
      <p className="text-sm text-muted-foreground">สถานะวันนี้ ({format(new Date(), "d MMM yyyy")})</p>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>แผนก</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เวลาที่ลง</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(activeUsers ?? []).map((u) => {
              const report = reportByUser.get(u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.department ?? "-"}</TableCell>
                  <TableCell>
                    {report ? (
                      <Badge variant={report.is_late ? "secondary" : "default"}>
                        {report.is_late ? "ลงสาย" : "ลงแล้ว"}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">ยังไม่ลง</Badge>
                    )}
                  </TableCell>
                  <TableCell>{report ? format(new Date(report.submitted_at), "HH:mm") : "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
