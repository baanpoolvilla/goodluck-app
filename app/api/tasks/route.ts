import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { createTaskSchema, taskListQuerySchema } from "@/lib/validation/tasks";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = taskListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, assigned_to, from, to, q, page, page_size } = parsed.data;

  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, assignee:users!assigned_to(id, full_name, avatar_url), assigner:users!assigned_by(id, full_name)", {
      count: "exact",
    });

  // RLS already scopes visibility (own tasks vs. all tasks for manager+);
  // these are just additional narrowing filters requested by the caller.
  if (status) query = query.eq("status", status);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (from) query = query.gte("deadline", from.toISOString());
  if (to) query = query.lte("deadline", to.toISOString());
  if (q) query = query.ilike("title", `%${q}%`);

  const start = (page - 1) * page_size;
  query = query.order("deadline", { ascending: true }).range(start, start + page_size - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data, page, page_size, total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagerOrAdmin(session.profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...parsed.data,
      deadline: parsed.data.deadline.toISOString(),
      assigned_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data }, { status: 201 });
}
