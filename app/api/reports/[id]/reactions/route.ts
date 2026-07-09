import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { reportReactionSchema } from "@/lib/validation/reports";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reportReactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_reactions")
    .insert({ report_id: id, user_id: session.id, emoji: parsed.data.emoji })
    .select()
    .single();

  if (error) {
    // Clicking the same emoji twice is a no-op, not an error.
    if (error.code === "23505") return NextResponse.json({ data: null });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const emoji = request.nextUrl.searchParams.get("emoji");
  if (!emoji) return NextResponse.json({ error: "emoji is required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("report_reactions")
    .delete()
    .eq("report_id", id)
    .eq("user_id", session.id)
    .eq("emoji", emoji);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
