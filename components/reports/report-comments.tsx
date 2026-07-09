"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; full_name: string } | null;
}

export function ReportComments({
  comments,
  onAddComment,
}: {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onAddComment(content);
      setContent("");
    } catch {
      // parent already surfaced the error via toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีความเห็น</p>}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="gradient-primary text-[10px] font-semibold text-white">
              {c.author?.full_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-xl bg-background p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{c.author?.full_name ?? "ไม่ทราบชื่อ"}</span>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.content}</p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <Textarea
          placeholder="เขียนความเห็น..."
          className="min-h-9 resize-none bg-background"
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          className="gradient-primary border-0"
          disabled={loading || !content.trim()}
        >
          ส่ง
        </Button>
      </form>
    </div>
  );
}
