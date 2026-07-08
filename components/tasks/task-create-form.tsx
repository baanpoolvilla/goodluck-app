"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignableUser {
  id: string;
  full_name: string;
}

export function TaskCreateForm({ users }: { users: AssignableUser[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    deadline: "",
    grade_weight: "1.0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "สร้างงานไม่สำเร็จ");
      return;
    }

    const { data } = await res.json();
    toast.success("สร้างงานสำเร็จ");
    router.push(`/tasks/${data.id}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">ชื่องาน</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ผู้รับผิดชอบ</Label>
              <Select
                required
                value={form.assigned_to}
                onValueChange={(v) => setForm({ ...form, assigned_to: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
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

            <div className="space-y-2">
              <Label>ความสำคัญ</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v ?? "medium" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">กลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="critical">วิกฤต</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">กำหนดส่ง</Label>
              <Input
                id="deadline"
                type="datetime-local"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_weight">น้ำหนักคะแนน (1.0 = ปกติ, 2.0 = สำคัญมาก)</Label>
              <Input
                id="grade_weight"
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={form.grade_weight}
                onChange={(e) => setForm({ ...form, grade_weight: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "กำลังสร้าง..." : "สร้างงาน"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
