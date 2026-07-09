import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { createReportSchema } from "@/lib/validation/reports";
import { isReportChannel } from "@/lib/reports/channels";

// Feed shape: one row per daily report, with the author + comment thread +
// reaction list embedded so the channel feed renders from a single query.
const FEED_SELECT =
  "*, author:users!user_id(id, full_name, avatar_url), comments:report_comments(*, author:users!user_id(id, full_name, avatar_url)), reactions:report_reactions(*)";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedChannel = request.nextUrl.searchParams.get("channel");
  const canPickChannel = isManagerOrAdmin(session.profile);
  const channel =
    canPickChannel && requestedChannel && isReportChannel(requestedChannel)
      ? requestedChannel
      : session.profile.channel;

  if (!channel) {
    return NextResponse.json(
      { error: "ยังไม่ได้กำหนด channel ให้บัญชีนี้ กรุณาติดต่อ Admin" },
      { status: 400 }
    );
  }

  const month = request.nextUrl.searchParams.get("month");
  const supabase = await createClient();
  let query = supabase
    .from("daily_reports")
    .select(FEED_SELECT)
    .eq("channel", channel)
    .order("report_date", { ascending: false })
    .order("submitted_at", { ascending: false })
    .order("created_at", { referencedTable: "report_comments", ascending: true })
    .limit(60);

  if (month) {
    query = query.gte("report_date", `${month}-01`).lt("report_date", nextMonthStart(month));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data, channel });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.profile.channel) {
    return NextResponse.json(
      { error: "ยังไม่ได้กำหนด channel ให้บัญชีนี้ กรุณาติดต่อ Admin" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("grade_configs")
    .select("*")
    .eq("module", "daily_report")
    .single();

  const now = new Date();
  const reportDate = (parsed.data.report_date ?? now).toISOString().slice(0, 10);

  const deadlineHour = config?.daily_report_deadline_hour ?? 20;
  const graceMinutes = config?.grace_period_minutes ?? 30;
  const deadline = new Date(now);
  deadline.setHours(deadlineHour, 0, 0, 0);
  const graceEnd = new Date(deadline.getTime() + graceMinutes * 60_000);

  const isLate = now > deadline;
  if (now > graceEnd) {
    return NextResponse.json(
      { error: `เลยเวลาที่กำหนดแล้ว (หลัง ${graceEnd.toTimeString().slice(0, 5)}) ระบบจะถือว่าไม่ได้ลง Daily Report วันนี้` },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      user_id: session.id,
      report_date: reportDate,
      content: parsed.data.content,
      is_late: isLate,
      channel: session.profile.channel,
    })
    .select(FEED_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "ลง Daily Report วันนี้ไปแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (isLate) {
    // Requires service role — regular users have no INSERT policy on penalty_logs.
    const admin = createAdminClient();
    await admin.rpc("apply_daily_report_penalty", {
      p_user_id: session.id,
      p_date: reportDate,
      p_missed: false,
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}

function nextMonthStart(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(y, m, 1);
  return next.toISOString().slice(0, 10);
}
