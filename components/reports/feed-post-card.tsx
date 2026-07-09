"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock3, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReactionBar } from "@/components/reports/reaction-bar";
import { ReportComments } from "@/components/reports/report-comments";
import type { Database } from "@/lib/db/database.types";

type Author = { id: string; full_name: string; avatar_url: string | null };
type ReportComment = Database["public"]["Tables"]["report_comments"]["Row"] & { author: Author | null };
type ReportReaction = Database["public"]["Tables"]["report_reactions"]["Row"];

export type FeedPost = Database["public"]["Tables"]["daily_reports"]["Row"] & {
  author: Author | null;
  comments: ReportComment[];
  reactions: ReportReaction[];
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function FeedPostCard({
  report,
  currentUserId,
  onAddComment,
  onToggleReaction,
}: {
  report: FeedPost;
  currentUserId: string;
  onAddComment: (content: string) => Promise<void>;
  onToggleReaction: (emoji: string) => Promise<void>;
}) {
  const [showComments, setShowComments] = useState(false);
  const author = report.author;

  return (
    <div className="card-hover overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar className="size-9">
          <AvatarFallback className="gradient-primary text-xs font-semibold text-white">
            {author ? initialsOf(author.full_name) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{author?.full_name ?? "ไม่ทราบชื่อ"}</span>
            {report.is_late ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Clock3 className="size-3" />
                ลงสาย
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                ทันเวลา
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(report.report_date), "d MMM yyyy")} ·{" "}
            {formatDistanceToNow(new Date(report.submitted_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div
        className="prose prose-sm dark:prose-invert max-w-none px-4 pb-3"
        dangerouslySetInnerHTML={{ __html: report.content }}
      />

      <div className="flex items-center justify-between border-t px-4 py-2">
        <ReactionBar reactions={report.reactions} currentUserId={currentUserId} onToggle={onToggleReaction} />
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <MessageCircle className="size-3.5" />
          {report.comments.length > 0 ? `${report.comments.length} ความเห็น` : "แสดงความเห็น"}
        </button>
      </div>

      {showComments && (
        <div className="border-t bg-muted/30 p-4">
          <ReportComments comments={report.comments} onAddComment={onAddComment} />
        </div>
      )}
    </div>
  );
}
