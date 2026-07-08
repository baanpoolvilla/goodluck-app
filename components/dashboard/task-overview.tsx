import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaskOverview({
  counts,
}: {
  counts: { pending: number; in_progress: number; overdue: number; completed: number };
}) {
  const items = [
    { label: "รอดำเนินการ", value: counts.pending, className: "text-muted-foreground" },
    { label: "กำลังทำ", value: counts.in_progress, className: "text-blue-600 dark:text-blue-400" },
    { label: "เลยกำหนด", value: counts.overdue, className: "text-destructive" },
    { label: "เสร็จแล้ว", value: counts.completed, className: "text-green-600 dark:text-green-400" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Task Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className={`text-2xl font-bold ${item.className}`}>{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
