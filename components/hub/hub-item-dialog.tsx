"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Database } from "@/lib/db/database.types";

type HubItem = Database["public"]["Tables"]["app_hub_items"]["Row"];
const ALL_ROLES = ["admin", "manager", "employee"] as const;

export function HubItemDialog({
  item,
  renderTrigger,
  children,
  onSaved,
}: {
  item?: HubItem;
  renderTrigger: React.ReactElement;
  children: React.ReactNode;
  onSaved: (item: HubItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    redirect_url: item?.redirect_url ?? "",
    allowed_roles: item?.allowed_roles ?? ["admin", "manager", "employee"],
    sort_order: item?.sort_order ?? 0,
    is_active: item?.is_active ?? true,
  });

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      allowed_roles: f.allowed_roles.includes(role)
        ? f.allowed_roles.filter((r) => r !== role)
        : [...f.allowed_roles, role],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = item ? `/api/hub/${item.id}` : "/api/hub";
    const res = await fetch(url, {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error(item ? "แก้ไขไม่สำเร็จ" : "สร้างไม่สำเร็จ");
      return;
    }

    const { data } = await res.json();
    toast.success("บันทึกแล้ว");
    setOpen(false);
    onSaved(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={renderTrigger}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "แก้ไข App" : "เพิ่ม App"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อ</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>คำอธิบาย</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>URL ปลายทาง</Label>
            <Input
              required
              value={form.redirect_url}
              onChange={(e) => setForm({ ...form, redirect_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role ที่เห็น</Label>
            <div className="flex gap-4">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={form.allowed_roles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">เปิดใช้งาน</Label>
            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
