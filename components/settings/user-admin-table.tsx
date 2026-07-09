"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { REPORT_CHANNELS } from "@/lib/reports/channels";
import type { Database } from "@/lib/db/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const ROLE_LABEL: Record<string, string> = { admin: "Admin", manager: "Manager", employee: "Employee" };
const NO_CHANNEL = "none";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAdminTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function patchUser(id: string, body: Record<string, unknown>) {
    setPendingId(id);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setPendingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(typeof data.error === "string" ? data.error : "บันทึกไม่สำเร็จ");
      return;
    }
    toast.success("บันทึกแล้ว");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="card-hover flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="gradient-primary text-xs font-semibold text-white">
                {initialsOf(u.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={u.role} onValueChange={(v) => v && patchUser(u.id, { role: v })}>
              <SelectTrigger size="sm" disabled={pendingId === u.id}>
                <SelectValue>{(value: string) => ROLE_LABEL[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={u.channel ?? NO_CHANNEL}
              onValueChange={(v) => v && patchUser(u.id, { channel: v === NO_CHANNEL ? null : v })}
            >
              <SelectTrigger size="sm" disabled={pendingId === u.id}>
                <SelectValue>
                  {(value: string) =>
                    value === NO_CHANNEL
                      ? "ไม่มี channel"
                      : (REPORT_CHANNELS.find((c) => c.value === value)?.label ?? value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CHANNEL}>ไม่มี channel</SelectItem>
                {REPORT_CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 pl-1">
              <Switch
                checked={u.is_active}
                disabled={pendingId === u.id}
                onCheckedChange={(checked) => patchUser(u.id, { is_active: checked })}
              />
              <span className="text-xs text-muted-foreground">{u.is_active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
