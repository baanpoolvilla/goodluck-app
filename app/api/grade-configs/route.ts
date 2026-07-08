import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { gradeConfigSchema } from "@/lib/validation/hub";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("grade_configs").select("*").order("module");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { module, ...rest } = body ?? {};
  if (module !== "task" && module !== "daily_report") {
    return NextResponse.json({ error: "module must be 'task' or 'daily_report'" }, { status: 400 });
  }

  const parsed = gradeConfigSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  // Keep task + daily_report weight_percent summing to 100 — the grading
  // function divides by 100 assuming that invariant holds.
  if (parsed.data.weight_percent !== undefined) {
    const { data: other } = await supabase
      .from("grade_configs")
      .select("weight_percent")
      .neq("module", module)
      .single();
    if (other && other.weight_percent + parsed.data.weight_percent !== 100) {
      return NextResponse.json(
        { error: `weight_percent ของสองโมดูลต้องรวมกันได้ 100 (อีกโมดูลตั้งไว้ ${other.weight_percent})` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("grade_configs")
    .update({ ...parsed.data, updated_by: session.id, updated_at: new Date().toISOString() })
    .eq("module", module)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}
