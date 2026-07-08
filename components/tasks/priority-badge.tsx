import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/lib/db/database.types";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "ต่ำ",
  medium: "กลาง",
  high: "สูง",
  critical: "วิกฤต",
};

const PRIORITY_VARIANT: Record<TaskPriority, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
