import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { isReportChannel, channelMeta } from "@/lib/reports/channels";
import { ReportSubmitForm } from "@/components/reports/report-submit-form";
import { ReportFeed } from "@/components/reports/report-feed";
import type { ReportChannel } from "@/lib/db/database.types";

const FEED_SELECT =
  "*, author:users!user_id(id, full_name, avatar_url), comments:report_comments(*, author:users!user_id(id, full_name, avatar_url)), reactions:report_reactions(*)";

export default async function ChannelReportsPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel: channelParam } = await params;
  if (!isReportChannel(channelParam)) notFound();
  const channel: ReportChannel = channelParam;

  const session = await getSessionUser();
  if (!session) return null;

  const managerOrAdmin = isManagerOrAdmin(session.profile);
  const isOwnChannel = session.profile.channel === channel;
  if (!isOwnChannel && !managerOrAdmin) {
    redirect(session.profile.channel ? `/reports/${session.profile.channel}` : "/reports");
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const [{ data: reports }, { data: channelUsers }] = await Promise.all([
    supabase
      .from("daily_reports")
      .select(FEED_SELECT)
      .eq("channel", channel)
      .order("report_date", { ascending: false })
      .order("submitted_at", { ascending: false })
      .order("created_at", { referencedTable: "report_comments", ascending: true })
      .limit(60),
    supabase.from("users").select("id, full_name, avatar_url").eq("is_active", true).eq("channel", channel),
  ]);

  const feedReports = reports ?? [];
  const userDirectory = channelUsers ?? [];
  const todaysReports = feedReports.filter((r) => r.report_date === today);
  const submittedToday = new Set(todaysReports.map((r) => r.user_id));
  const missing = userDirectory.filter((u) => !submittedToday.has(u.id));
  const myReportToday = todaysReports.find((r) => r.user_id === session.id);

  const meta = channelMeta(channel);
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="gradient-primary flex size-9 shrink-0 items-center justify-center rounded-xl shadow-md shadow-primary/25">
          <Icon className="size-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{meta.label}</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
        </div>
      </div>

      {managerOrAdmin && userDirectory.length > 0 && (
        <div className="overflow-hidden rounded-xl shadow-sm">
          <div className="gradient-primary flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white">
            <span>ลง Daily Report วันนี้แล้ว</span>
            <span>
              {submittedToday.size}/{userDirectory.length}
            </span>
          </div>
          {missing.length > 0 && (
            <p className="border border-t-0 bg-card px-4 py-2 text-xs text-muted-foreground">
              ยังไม่ลง: {missing.map((u) => u.full_name).join(", ")}
            </p>
          )}
        </div>
      )}

      {isOwnChannel && !myReportToday && <ReportSubmitForm />}

      <ReportFeed
        channel={channel}
        initialReports={feedReports}
        userDirectory={userDirectory}
        currentUserId={session.id}
      />
    </div>
  );
}
