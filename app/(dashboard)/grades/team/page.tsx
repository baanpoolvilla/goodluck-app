import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function TeamGradesPage() {
  const session = await getSessionUser();
  if (!session || !isManagerOrAdmin(session.profile)) redirect("/grades");

  const monthStart = new Date().toISOString().slice(0, 8) + "01";
  const supabase = await createClient();

  const { data: grades } = await supabase
    .from("monthly_grades")
    .select("*, user:users!user_id(id, full_name, department)")
    .eq("month", monthStart)
    .order("total_score", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">คะแนนทีม — เดือนนี้</h1>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Report</TableHead>
              <TableHead>รวม</TableHead>
              <TableHead>เกรด</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(grades ?? []).map((g, i) => (
              <TableRow key={g.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">
                  {(g as unknown as { user: { full_name: string } }).user?.full_name}
                </TableCell>
                <TableCell>{g.task_score}</TableCell>
                <TableCell>{g.report_score}</TableCell>
                <TableCell>{g.total_score}</TableCell>
                <TableCell>
                  <Badge>{g.grade}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {(grades ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  ยังไม่มีข้อมูลคะแนนเดือนนี้ (จะคำนวณอัตโนมัติวันที่ 1 ของเดือนถัดไป)
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
