"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/reports/rich-text-editor";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <RichTextEditor value={content} onChange={setContent} placeholder="วันนี้ทำอะไรบ้าง..." />
      <Button type="submit" disabled={loading || !content.trim()}>
        {loading ? "กำลังส่ง..." : "ส่ง Daily Report"}
      </Button>
    </form>
  );
}
