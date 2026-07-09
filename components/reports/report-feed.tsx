"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { FeedPostCard, type FeedPost } from "@/components/reports/feed-post-card";
import type { Database, ReportChannel } from "@/lib/db/database.types";

type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
type ReportComment = Database["public"]["Tables"]["report_comments"]["Row"];
type ReportReaction = Database["public"]["Tables"]["report_reactions"]["Row"];

export interface UserDirectoryEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export function ReportFeed({
  channel,
  initialReports,
  userDirectory,
  currentUserId,
}: {
  channel: ReportChannel;
  initialReports: FeedPost[];
  userDirectory: UserDirectoryEntry[];
  currentUserId: string;
}) {
  const [reports, setReports] = useState(initialReports);

  // Re-sync whenever the server hands us a fresh snapshot (e.g. after the
  // composer's router.refresh() following a new submission). Adjusting
  // state during render — rather than in an effect — avoids an extra
  // cascading render (see "Adjusting state when a prop changes" in the
  // React docs).
  const [syncedReports, setSyncedReports] = useState(initialReports);
  if (initialReports !== syncedReports) {
    setSyncedReports(initialReports);
    setReports(initialReports);
  }

  useEffect(() => {
    const supabase = createClient();
    const directory = new Map(userDirectory.map((u) => [u.id, u]));

    function authorFor(userId: string) {
      const u = directory.get(userId);
      return { id: userId, full_name: u?.full_name ?? "ไม่ทราบชื่อ", avatar_url: u?.avatar_url ?? null };
    }

    const rt = supabase
      .channel(`reports-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "daily_reports" },
        (payload) => {
          const row = payload.new as DailyReport;
          if (row.channel !== channel) return;
          setReports((prev) =>
            prev.some((r) => r.id === row.id)
              ? prev
              : [{ ...row, author: authorFor(row.user_id), comments: [], reactions: [] }, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_comments" },
        (payload) => {
          const row = payload.new as ReportComment;
          setReports((prev) =>
            prev.map((r) =>
              r.id === row.report_id && !r.comments.some((c) => c.id === row.id)
                ? { ...r, comments: [...r.comments, { ...row, author: authorFor(row.user_id) }] }
                : r
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "report_reactions" },
        (payload) => {
          const row = payload.new as ReportReaction;
          setReports((prev) =>
            prev.map((r) =>
              r.id === row.report_id && !r.reactions.some((x) => x.id === row.id)
                ? { ...r, reactions: [...r.reactions, row] }
                : r
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "report_reactions" },
        (payload) => {
          const old = payload.old as Partial<ReportReaction>;
          setReports((prev) =>
            prev.map((r) =>
              r.reactions.some((x) => x.id === old.id)
                ? { ...r, reactions: r.reactions.filter((x) => x.id !== old.id) }
                : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rt);
    };
  }, [channel, userDirectory]);

  function updateReport(reportId: string, updater: (r: FeedPost) => FeedPost) {
    setReports((prev) => prev.map((r) => (r.id === reportId ? updater(r) : r)));
  }

  async function handleAddComment(reportId: string, content: string) {
    const res = await fetch(`/api/reports/${reportId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      toast.error("ส่งความเห็นไม่สำเร็จ");
      throw new Error("failed to add comment");
    }

    const { data } = await res.json();
    updateReport(reportId, (r) => ({ ...r, comments: [...r.comments, data] }));
  }

  async function handleToggleReaction(reportId: string, emoji: string) {
    const report = reports.find((r) => r.id === reportId);
    const mine = report?.reactions.find((x) => x.user_id === currentUserId && x.emoji === emoji);

    if (mine) {
      const res = await fetch(`/api/reports/${reportId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        updateReport(reportId, (r) => ({ ...r, reactions: r.reactions.filter((x) => x.id !== mine.id) }));
      } else {
        toast.error("ลบ reaction ไม่สำเร็จ");
      }
      return;
    }

    const res = await fetch(`/api/reports/${reportId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) {
      toast.error("เพิ่ม reaction ไม่สำเร็จ");
      return;
    }
    const { data } = await res.json();
    if (data) updateReport(reportId, (r) => ({ ...r, reactions: [...r.reactions, data] }));
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีรายงานใน channel นี้
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <FeedPostCard
          key={report.id}
          report={report}
          currentUserId={currentUserId}
          onAddComment={(content) => handleAddComment(report.id, content)}
          onToggleReaction={(emoji) => handleToggleReaction(report.id, emoji)}
        />
      ))}
    </div>
  );
}
