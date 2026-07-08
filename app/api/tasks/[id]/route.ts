import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { updateTaskSchema, isValidTaskTransition } from "@/lib/validation/tasks";
import type { Database } from "@/lib/db/database.types";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:users!assigned_to(id, full_name, avatar_url), assigner:users!assigned_by(id, full_name)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managerOrAdmin = isManagerOrAdmin(session.profile);
  const isAssignee = existing.assigned_to === session.id;
  if (!managerOrAdmin && !isAssignee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { deadline, ...rest } = parsed.data;
  const update: TaskUpdate = { ...rest };
  if (deadline) update.deadline = deadline.toISOString();

  if (parsed.data.status) {
    if (!isValidTaskTransition(existing.status, parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 409 }
      );
    }
    if (parsed.data.status === "completed" || parsed.data.status === "completed_late") {
      update.completed_at = new Date().toISOString();
    }
  }

  // Non-manager assignees may only update status — reassigning/rescoping is manager territory.
  if (!managerOrAdmin) {
    for (const key of Object.keys(update) as (keyof TaskUpdate)[]) {
      if (key !== "status") delete update[key];
    }
  }

  const { data, error } = await supabase.from("tasks").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagerOrAdmin(session.profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return new NextResponse(null, { status: 204 });
}
