"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isValidTaskTransition } from "@/lib/validation/tasks";
import type { TaskStatus } from "@/lib/db/database.types";

const ACTIONS: { to: TaskStatus; label: string; variant?: "default" | "destructive" | "outline" }[] = [
  { to: "in_progress", label: "รับงาน / เริ่มทำ" },
  { to: "completed", label: "ทำเสร็จแล้ว" },
  { to: "completed_late", label: "ทำเสร็จแล้ว (สาย)" },
  { to: "cancelled", label: "ยกเลิกงาน", variant: "destructive" },
];

export function TaskStatusActions({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<TaskStatus | null>(null);

  const available = ACTIONS.filter((a) => isValidTaskTransition(status, a.to));
  if (available.length === 0) return null;

  async function updateStatus(to: TaskStatus) {
    setLoading(to);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setLoading(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(typeof body.error === "string" ? body.error : "อัปเดตสถานะไม่สำเร็จ");
      return;
    }

    toast.success("อัปเดตสถานะแล้ว");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((action) => (
        <Button
          key={action.to}
          variant={action.variant ?? "default"}
          className={cn(!action.variant && "gradient-primary border-0")}
          disabled={loading !== null}
          onClick={() => updateStatus(action.to)}
        >
          {loading === action.to ? "กำลังอัปเดต..." : action.label}
        </Button>
      ))}
    </div>
  );
}
