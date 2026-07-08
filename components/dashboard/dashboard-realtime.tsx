"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/db/database.types";

type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
type PenaltyLog = Database["public"]["Tables"]["penalty_logs"]["Row"];

export interface ReportStatusEntry {
  userId: string;
  fullName: string;
  submittedAt: string | null;
  isLate: boolean;
}

export function DashboardRealtime({
  today,
  initialReportStatus,
  initialPenalties,
  userNames,
  canSeeTeam,
}: {
  today: string;
  initialReportStatus: ReportStatusEntry[];
  initialPenalties: (PenaltyLog & { userName: string })[];
  userNames: Record<string, string>;
  canSeeTeam: boolean;
}) {
  const [reportStatus, setReportStatus] = useState(initialReportStatus);
  const [penalties, setPenalties] = useState(initialPenalties);

  useEffect(() => {
    const supabase = createClient();

    // Mirrors spec section 5.3 — one channel drives both the Daily Report
    // Status table and the Penalty Feed.
    const channel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_reports" },
        (payload) => {
          const report = payload.new as DailyReport;
          if (report.report_date !== today) return;

          setReportStatus((prev) =>
            prev.map((entry) =>
              entry.userId === report.user_id
                ? { ...entry, submittedAt: report.submitted_at, isLate: report.is_late }
                : entry
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "penalty_logs" },
        (payload) => {
          const penalty = payload.new as PenaltyLog;
          setPenalties((prev) =>
            [{ ...penalty, userName: userNames[penalty.user_id] ?? "-" }, ...prev].slice(0, 10)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, userNames]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {canSeeTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Report Status (วันนี้)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {reportStatus.map((entry) => (
              <div key={entry.userId} className="flex items-center justify-between text-sm">
                <span>{entry.fullName}</span>
                {entry.submittedAt ? (
                  <span className="flex items-center gap-2">
                    {entry.isLate && (
                      <Badge variant="secondary" className="text-[10px]">
                        สาย
                      </Badge>
                    )}
                    <span className="text-muted-foreground">{format(new Date(entry.submittedAt), "HH:mm")}</span>
                  </span>
                ) : (
                  <span className="text-destructive">❌</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Penalty Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {penalties.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มี penalty</p>}
          {penalties.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="truncate">
                {p.userName} — {p.reason}
              </span>
              <span className="font-medium text-destructive">-{p.penalty_amount}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
