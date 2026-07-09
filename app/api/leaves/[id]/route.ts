import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { updateLeaveSchema } from "@/lib/validation/leaves";
import type { Database } from "@/lib/db/database.types";

type LeaveUpdate = Database["public"]["Tables"]["leaves"]["Update"];

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leaves")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managerOrAdmin = isManagerOrAdmin(session.profile);
  if (!managerOrAdmin && existing.user_id !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { start_date, end_date, ...rest } = parsed.data;
  const update: LeaveUpdate = { ...rest };
  if (start_date) update.start_date = start_date.toISOString().slice(0, 10);
  if (end_date) update.end_date = end_date.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("leaves")
    .update(update)
    .eq("id", id)
    .select("*, user:users!user_id(id, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leaves")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managerOrAdmin = isManagerOrAdmin(session.profile);
  if (!managerOrAdmin && existing.user_id !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("leaves").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return new NextResponse(null, { status: 204 });
}
