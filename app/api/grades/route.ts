import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedUserId = request.nextUrl.searchParams.get("user_id");
  let userId = session.id;

  if (requestedUserId && requestedUserId !== session.id) {
    if (!isManagerOrAdmin(session.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    userId = requestedUserId;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_grades")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}
