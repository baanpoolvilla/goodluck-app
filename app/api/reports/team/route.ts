import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagerOrAdmin(session.profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const [{ data: activeUsers }, { data: reports }] = await Promise.all([
    supabase.from("users").select("id, full_name, department").eq("is_active", true),
    supabase.from("daily_reports").select("*").eq("report_date", date),
  ]);

  const reportByUser = new Map((reports ?? []).map((r) => [r.user_id, r]));
  const data = (activeUsers ?? []).map((u) => ({
    user: u,
    report: reportByUser.get(u.id) ?? null,
  }));

  return NextResponse.json({ data, date });
}
