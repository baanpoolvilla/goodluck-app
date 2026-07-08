"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/db/database.types";

type GradeConfig = Database["public"]["Tables"]["grade_configs"]["Row"];

export function GradeConfigForm({ config }: { config: GradeConfig }) {
  const router = useRouter();
  const [form, setForm] = useState({
    weight_percent: config.weight_percent,
    penalty_per_day_late: config.penalty_per_day_late,
    penalty_per_missed: config.penalty_per_missed,
    max_penalty_per_item: config.max_penalty_per_item,
    daily_report_deadline_hour: config.daily_report_deadline_hour,
    grace_period_minutes: config.grace_period_minutes,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/grade-configs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: config.module, ...form }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(typeof body.error === "string" ? body.error : "บันทึกไม่สำเร็จ");
      return;
    }

    toast.success("บันทึกการตั้งค่าแล้ว");
    router.refresh();
  }

  const isTask = config.module === "task";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isTask ? "Task" : "Daily Report"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>สัดส่วนคะแนน (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.weight_percent}
              onChange={(e) => setForm({ ...form, weight_percent: Number(e.target.value) })}
            />
          </div>

          {isTask ? (
            <div className="space-y-2">
              <Label>หักคะแนน/วันที่สาย</Label>
              <Input
                type="number"
                step="0.5"
                value={form.penalty_per_day_late}
                onChange={(e) => setForm({ ...form, penalty_per_day_late: Number(e.target.value) })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>หักคะแนน/ครั้งที่ไม่ลง</Label>
              <Input
                type="number"
                step="0.5"
                value={form.penalty_per_missed}
                onChange={(e) => setForm({ ...form, penalty_per_missed: Number(e.target.value) })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>หักสูงสุดต่อ item</Label>
            <Input
              type="number"
              step="0.5"
              value={form.max_penalty_per_item}
              onChange={(e) => setForm({ ...form, max_penalty_per_item: Number(e.target.value) })}
            />
          </div>

          {!isTask && (
            <>
              <div className="space-y-2">
                <Label>เวลา deadline (ชั่วโมง, 0-23)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.daily_report_deadline_hour}
                  onChange={(e) =>
                    setForm({ ...form, daily_report_deadline_hour: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Grace period (นาที)</Label>
                <Input
                  type="number"
                  min={0}
                  max={180}
                  value={form.grace_period_minutes}
                  onChange={(e) => setForm({ ...form, grace_period_minutes: Number(e.target.value) })}
                />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
