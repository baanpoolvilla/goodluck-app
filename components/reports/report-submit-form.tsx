"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RichTextEditor = dynamic(
  () => import("@/components/reports/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
);

export function ReportSubmitForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(typeof body.error === "string" ? body.error : "ส่งรายงานไม่สำเร็จ");
      return;
    }

    toast.success("ส่ง Daily Report สำเร็จ");
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      <div className="gradient-primary px-5 py-3">
        <p className="text-sm font-medium text-white/90">วันนี้ยังไม่ได้ลงรายงาน</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 bg-card p-5">
        <RichTextEditor value={content} onChange={setContent} placeholder="วันนี้ทำอะไรบ้าง..." />
        <Button type="submit" className="gradient-primary border-0" disabled={loading || !content.trim()}>
          {loading ? "กำลังส่ง..." : "ส่ง Daily Report"}
        </Button>
      </form>
    </div>
  );
}
