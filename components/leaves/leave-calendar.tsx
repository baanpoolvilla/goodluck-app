"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LEAVE_TYPE_CLASSES, LEAVE_TYPE_LABEL } from "@/components/leaves/leave-type-badge";
import { LeaveFormDialog } from "@/components/leaves/leave-form-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/db/database.types";

type Leave = Database["public"]["Tables"]["leaves"]["Row"] & {
  user: { id: string; full_name: string; avatar_url: string | null } | null;
};
interface SelectableUser {
  id: string;
  full_name: string;
}

const WEEKDAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const MAX_VISIBLE_PER_DAY = 3;

function toDateOnly(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function gridRange(month: Date) {
  return {
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  };
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
  const [loading, setLoading] = useState(false);
  const loadedMonths = useState(() => new Set([toDateOnly(startOfMonth(initialMonth))]))[0];

  async function loadMonth(target: Date) {
    const key = toDateOnly(startOfMonth(target));
    if (loadedMonths.has(key)) return;
    loadedMonths.add(key);

    setLoading(true);
    const { start, end } = gridRange(target);
    const res = await fetch(`/api/leaves?from=${toDateOnly(start)}&to=${toDateOnly(end)}`);
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

  const gridDays = useMemo(() => {
    const { start, end } = gridRange(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

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
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
            {loading && <span className="text-xs text-muted-foreground">กำลังโหลด...</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label="เดือนก่อนหน้า"
              onClick={() => handleMonthChange(subMonths(month, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleMonthChange(new Date())}>
              วันนี้
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="เดือนถัดไป"
              onClick={() => handleMonthChange(addMonths(month, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
            <LeaveFormDialog
              currentUserId={currentUserId}
              users={users}
              canPickUser={canManageAny}
              renderTrigger={<Button size="sm" className="ml-1" />}
              onSaved={upsertLeave}
            >
              <Plus className="mr-1 size-4" />
              เพิ่มวันลา
            </LeaveFormDialog>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((day) => {
              const key = toDateOnly(day);
              const dayLeaves = leavesByDate.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const today = isToday(day);
              const visible = dayLeaves.slice(0, MAX_VISIBLE_PER_DAY);
              const overflow = dayLeaves.length - visible.length;

              return (
                <div
                  key={key}
                  className={cn(
                    "group flex min-h-28 flex-col gap-1 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        today
                          ? "bg-primary text-primary-foreground"
                          : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <LeaveFormDialog
                      currentUserId={currentUserId}
                      users={users}
                      canPickUser={canManageAny}
                      defaultDate={key}
                      renderTrigger={
                        <button
                          type="button"
                          aria-label="เพิ่มวันลา"
                          className="flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100"
                        />
                      }
                      onSaved={upsertLeave}
                    >
                      <Plus className="size-3.5" />
                    </LeaveFormDialog>
                  </div>

                  <div className="flex flex-col gap-1">
                    {visible.map((leave) => (
                      <LeaveFormDialog
                        key={leave.id}
                        leave={leave}
                        currentUserId={currentUserId}
                        users={users}
                        canPickUser={canManageAny}
                        renderTrigger={
                          <button
                            type="button"
                            className={cn(
                              "truncate rounded-full px-2 py-0.5 text-left text-[11px] font-medium",
                              LEAVE_TYPE_CLASSES[leave.leave_type]
                            )}
                          />
                        }
                        onSaved={upsertLeave}
                        onDeleted={removeLeave}
                      >
                        {leave.user?.full_name ?? "-"} · {LEAVE_TYPE_LABEL[leave.leave_type]}
                      </LeaveFormDialog>
                    ))}

                    {overflow > 0 && (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="truncate rounded-full px-2 py-0.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted"
                            />
                          }
                        >
                          +{overflow} เพิ่มเติม
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64">
                          <PopoverHeader>
                            <PopoverTitle>{format(day, "d MMMM yyyy")}</PopoverTitle>
                          </PopoverHeader>
                          <ul className="space-y-1">
                            {dayLeaves.map((leave) => (
                              <li key={leave.id}>
                                <LeaveFormDialog
                                  leave={leave}
                                  currentUserId={currentUserId}
                                  users={users}
                                  canPickUser={canManageAny}
                                  renderTrigger={
                                    <button
                                      type="button"
                                      className={cn(
                                        "w-full truncate rounded-md px-2 py-1 text-left text-xs font-medium",
                                        LEAVE_TYPE_CLASSES[leave.leave_type]
                                      )}
                                    />
                                  }
                                  onSaved={upsertLeave}
                                  onDeleted={removeLeave}
                                >
                                  {leave.user?.full_name ?? "-"} · {LEAVE_TYPE_LABEL[leave.leave_type]}
                                </LeaveFormDialog>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
