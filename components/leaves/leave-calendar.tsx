"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeaveTypeBadge } from "@/components/leaves/leave-type-badge";
import { LeaveFormDialog } from "@/components/leaves/leave-form-dialog";
import type { Database } from "@/lib/db/database.types";

type Leave = Database["public"]["Tables"]["leaves"]["Row"] & {
  user: { id: string; full_name: string; avatar_url: string | null } | null;
};
interface SelectableUser {
  id: string;
  full_name: string;
}

function toDateOnly(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function LeaveCalendar({
  initialLeaves,
  initialMonth,
  users,
  currentUserId,
  canManageAny,
}: {
  initialLeaves: Leave[];
  initialMonth: Date;
  users: SelectableUser[];
  currentUserId: string;
  canManageAny: boolean;
}) {
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const loadedMonths = useState(() => new Set([toDateOnly(startOfMonth(initialMonth))]))[0];

  async function loadMonth(target: Date) {
    const key = toDateOnly(startOfMonth(target));
    if (loadedMonths.has(key)) return;
    loadedMonths.add(key);

    setLoading(true);
    const from = toDateOnly(startOfMonth(target));
    const to = toDateOnly(endOfMonth(target));
    const res = await fetch(`/api/leaves?from=${from}&to=${to}`);
    setLoading(false);
    if (!res.ok) return;

    const { data } = await res.json();
    setLeaves((prev) => {
      const merged = new Map(prev.map((l) => [l.id, l]));
      for (const l of data as Leave[]) merged.set(l.id, l);
      return Array.from(merged.values());
    });
  }

  function handleMonthChange(next: Date) {
    setMonth(next);
    void loadMonth(next);
  }

  const leavesByDate = useMemo(() => {
    const map = new Map<string, Leave[]>();
    for (const leave of leaves) {
      let cur = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      while (cur <= end) {
        const key = toDateOnly(cur);
        const list = map.get(key) ?? [];
        list.push(leave);
        map.set(key, list);
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    }
    return map;
  }, [leaves]);

  const daysWithLeave = useMemo(
    () => Array.from(leavesByDate.keys()).map((k) => parseISO(k)),
    [leavesByDate]
  );

  const selectedLeaves = leavesByDate.get(toDateOnly(selected)) ?? [];

  function upsertLeave(saved: Leave) {
    setLeaves((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  function removeLeave(id: string) {
    setLeaves((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
      <Card className="w-fit">
        <CardContent className="p-2">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={handleMonthChange}
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            modifiers={{ hasLeave: daysWithLeave }}
            modifiersClassNames={{
              hasLeave:
                "relative after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">
              {format(selected, "d MMMM yyyy")}
              {loading && <span className="ml-2 text-xs text-muted-foreground">กำลังโหลด...</span>}
            </h2>
            <LeaveFormDialog
              currentUserId={currentUserId}
              users={users}
              canPickUser={canManageAny}
              renderTrigger={<Button size="sm" />}
              onSaved={upsertLeave}
            >
              <Plus className="mr-1 size-4" />
              เพิ่มวันลา
            </LeaveFormDialog>
          </div>

          {selectedLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีใครลาวันนี้</p>
          ) : (
            <ul className="space-y-3">
              {selectedLeaves.map((leave) => {
                const canEdit = canManageAny || leave.user_id === currentUserId;
                return (
                  <li
                    key={leave.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{leave.user?.full_name ?? "-"}</span>
                        <LeaveTypeBadge type={leave.leave_type} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {leave.start_date === leave.end_date
                          ? format(parseISO(leave.start_date), "d MMM yyyy")
                          : `${format(parseISO(leave.start_date), "d MMM")} - ${format(
                              parseISO(leave.end_date),
                              "d MMM yyyy"
                            )}`}
                      </p>
                      {leave.reason && <p className="text-sm">{leave.reason}</p>}
                    </div>
                    {canEdit && (
                      <LeaveFormDialog
                        leave={leave}
                        currentUserId={currentUserId}
                        users={users}
                        canPickUser={canManageAny}
                        renderTrigger={<Button size="sm" variant="outline" />}
                        onSaved={upsertLeave}
                        onDeleted={removeLeave}
                      >
                        แก้ไข
                      </LeaveFormDialog>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
