import { redirect } from "next/navigation";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { REPORT_CHANNEL_VALUES } from "@/lib/reports/channels";

export default async function ReportsIndexPage() {
  const session = await getSessionUser();
  if (!session) return null;

  if (session.profile.channel) {
    redirect(`/reports/${session.profile.channel}`);
  }

  if (isManagerOrAdmin(session.profile)) {
    redirect(`/reports/${REPORT_CHANNEL_VALUES[0]}`);
  }

  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      ยังไม่ได้กำหนด channel ให้บัญชีนี้ กรุณาติดต่อ Admin เพื่อกำหนด channel ก่อนใช้งาน Report
    </div>
  );
}
