"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; full_name: string } | null;
}

export function TaskComments({ taskId, comments }: { taskId: string; comments: Comment[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error("ส่งความเห็นไม่สำเร็จ");
      return;
    }

    setContent("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">ความเห็น</h2>

      <div className="space-y-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีความเห็น</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="size-8">
              <AvatarFallback>{c.author?.full_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.author?.full_name ?? "ไม่ทราบชื่อ"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="เขียนความเห็น..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "กำลังส่ง..." : "ส่งความเห็น"}
        </Button>
      </form>
    </div>
  );
}
