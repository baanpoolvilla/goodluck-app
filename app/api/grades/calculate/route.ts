import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser, isAdmin } from "@/lib/auth/session";

/**
 * Admin-triggered recalculation. Body: { month: "YYYY-MM-DD" (first of month),
 * user_id?: string } — omit user_id to recalculate every active user.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const month = body.month ?? new Date().toISOString().slice(0, 8) + "01";

  const admin = createAdminClient();

  let userIds: string[];
  if (body.user_id) {
    userIds = [body.user_id];
  } else {
    const { data: users, error } = await admin.from("users").select("id").eq("is_active", true);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    userIds = (users ?? []).map((u) => u.id);
  }

  const results = await Promise.all(
    userIds.map((id) => admin.rpc("calculate_monthly_grade", { p_user_id: id, p_month: month }))
  );

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    return NextResponse.json(
      { error: "Some users failed to recalculate", details: failed.map((f) => f.error?.message) },
      { status: 207 }
    );
  }

  return NextResponse.json({ recalculated: userIds.length, month });
}
