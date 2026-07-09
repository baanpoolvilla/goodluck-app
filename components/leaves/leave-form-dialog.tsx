"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LEAVE_TYPE_LABEL } from "@/components/leaves/leave-type-badge";
import type { Database, LeaveType } from "@/lib/db/database.types";

type Leave = Database["public"]["Tables"]["leaves"]["Row"] & {
  user: { id: string; full_name: string; avatar_url: string | null } | null;
};
interface SelectableUser {
  id: string;
  full_name: string;
}

const LEAVE_TYPES: LeaveType[] = ["vacation", "sick", "personal", "unpaid", "other"];

export function LeaveFormDialog({
  leave,
  currentUserId,
  users,
  canPickUser,
  renderTrigger,
  children,
  onSaved,
  onDeleted,
}: {
  leave?: Leave;
  currentUserId: string;
  users: SelectableUser[];
  canPickUser: boolean;
  renderTrigger: React.ReactElement;
  children: React.ReactNode;
  onSaved: (leave: Leave) => void;
  onDeleted?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    user_id: leave?.user_id ?? currentUserId,
    start_date: leave?.start_date ?? "",
    end_date: leave?.end_date ?? "",
    leave_type: leave?.leave_type ?? "vacation",
    reason: leave?.reason ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = leave ? `/api/leaves/${leave.id}` : "/api/leaves";
    const res = await fetch(url, {
      method: leave ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "บันทึกไม่สำเร็จ");
      return;
    }

    const { data } = await res.json();
    toast.success("บันทึกวันลาแล้ว");
    setOpen(false);
    onSaved(data);
  }

  async function handleDelete() {
    if (!leave) return;
    setLoading(true);
    const res = await fetch(`/api/leaves/${leave.id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      toast.error("ลบไม่สำเร็จ");
      return;
    }

    toast.success("ลบรายการวันลาแล้ว");
    setOpen(false);
    onDeleted?.(leave.id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={renderTrigger}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{leave ? "แก้ไขวันลา" : "เพิ่มวันลา"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {canPickUser && (
            <div className="space-y-2">
              <Label>พนักงาน</Label>
              <Select
                value={form.user_id}
                onValueChange={(v) => setForm({ ...form, user_id: v ?? currentUserId })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน">
                    {(value: string) => users.find((u) => u.id === value)?.full_name ?? "เลือกพนักงาน"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">วันเริ่มลา</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">วันสิ้นสุด</Label>
              <Input
                id="end_date"
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ประเภทการลา</Label>
            <Select
              value={form.leave_type}
              onValueChange={(v) => setForm({ ...form, leave_type: (v as LeaveType) ?? "vacation" })}
            >
              <SelectTrigger>
                <SelectValue>{(value: LeaveType) => LEAVE_TYPE_LABEL[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {LEAVE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">เหตุผล (ถ้ามี)</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="items-center sm:justify-between">
            {leave ? (
              <Button type="button" variant="destructive" disabled={loading} onClick={handleDelete}>
                ลบ
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
