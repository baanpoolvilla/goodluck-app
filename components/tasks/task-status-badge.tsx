import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/lib/db/database.types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังทำ",
  completed: "เสร็จแล้ว",
  completed_late: "เสร็จ (สาย)",
  overdue: "เลยกำหนด",
  cancelled: "ยกเลิก",
};

const STATUS_VARIANT: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
  completed_late: "secondary",
  overdue: "destructive",
  cancelled: "outline",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
