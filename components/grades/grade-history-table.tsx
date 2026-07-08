import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/db/database.types";

type MonthlyGrade = Database["public"]["Tables"]["monthly_grades"]["Row"];

const GRADE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  A: "default",
  B: "default",
  C: "secondary",
  D: "secondary",
  F: "destructive",
};

export function GradeHistoryTable({ grades }: { grades: MonthlyGrade[] }) {
  if (grades.length === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีประวัติคะแนน</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>เดือน</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Report</TableHead>
            <TableHead>รวม</TableHead>
            <TableHead>เกรด</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{format(new Date(g.month), "MMMM yyyy")}</TableCell>
              <TableCell>{g.task_score}</TableCell>
              <TableCell>{g.report_score}</TableCell>
              <TableCell className="font-medium">{g.total_score ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={GRADE_VARIANT[g.grade ?? ""] ?? "outline"}>{g.grade ?? "-"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
