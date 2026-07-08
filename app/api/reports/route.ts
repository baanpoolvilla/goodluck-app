import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { createReportSchema } from "@/lib/validation/reports";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month");
  const supabase = await createClient();
  let query = supabase
    .from("daily_reports")
    .select("*")
    .eq("user_id", session.id)
    .order("report_date", { ascending: false });

  if (month) {
    query = query.gte("report_date", `${month}-01`).lt("report_date", nextMonthStart(month));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    })
    .select()
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
