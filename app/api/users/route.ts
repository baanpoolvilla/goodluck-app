import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAdmin, isManagerOrAdmin } from "@/lib/auth/session";

const updateUserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "manager", "employee"]).optional(),
  department: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  line_user_id: z.string().max(100).nullable().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isManagerOrAdmin(session.profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id, ...update } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").update(update).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
