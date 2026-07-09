import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { ChannelSidebar } from "@/components/reports/channel-sidebar";
import { REPORT_CHANNELS, channelMeta } from "@/lib/reports/channels";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) return null;

  const channels = isManagerOrAdmin(session.profile)
    ? REPORT_CHANNELS
    : session.profile.channel
      ? [channelMeta(session.profile.channel)]
      : [];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Channels
        </div>
        {channels.length > 0 ? (
          <ChannelSidebar channels={channels} />
        ) : (
          <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            ยังไม่ได้กำหนด channel ให้บัญชีนี้ กรุณาติดต่อ Admin
          </p>
        )}
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
