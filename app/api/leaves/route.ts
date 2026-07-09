import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { createLeaveSchema, leaveListQuerySchema } from "@/lib/validation/leaves";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = leaveListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { from, to } = parsed.data;

  const supabase = await createClient();
  let query = supabase
    .from("leaves")
    .select("*, user:users!user_id(id, full_name, avatar_url)")
    .order("start_date", { ascending: true });

  // Overlap filter: an entry is in range unless it ends before `from` or starts after `to`.
  if (from) query = query.gte("end_date", from.toISOString().slice(0, 10));
  if (to) query = query.lte("start_date", to.toISOString().slice(0, 10));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Only manager/admin may file a leave on someone else's behalf.
  const targetUserId =
    parsed.data.user_id && isManagerOrAdmin(session.profile) ? parsed.data.user_id : session.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaves")
    .insert({
      user_id: targetUserId,
      start_date: parsed.data.start_date.toISOString().slice(0, 10),
      end_date: parsed.data.end_date.toISOString().slice(0, 10),
      leave_type: parsed.data.leave_type,
      reason: parsed.data.reason,
      created_by: session.id,
    })
    .select("*, user:users!user_id(id, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data }, { status: 201 });
}
