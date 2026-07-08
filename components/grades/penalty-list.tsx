import { format } from "date-fns";
import type { Database } from "@/lib/db/database.types";

type PenaltyLog = Database["public"]["Tables"]["penalty_logs"]["Row"];

export function PenaltyList({ penalties }: { penalties: PenaltyLog[] }) {
  if (penalties.length === 0) {
    return <p className="text-sm text-muted-foreground">ไม่มี penalty ในเดือนนี้</p>;
  }

  return (
    <ul className="space-y-2">
      {penalties.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div>
            <div>{p.reason}</div>
            <div className="text-xs text-muted-foreground">{format(new Date(p.penalty_date), "d MMM yyyy")}</div>
          </div>
          <span className="font-medium text-destructive">-{p.penalty_amount}</span>
        </li>
      ))}
    </ul>
  );
}
