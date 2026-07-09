import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { LeaveCalendar } from "@/components/leaves/leave-calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function CalendarPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const supabase = await createClient();
  const [{ data: leaves }, { data: users }] = await Promise.all([
    supabase
      .from("leaves")
      .select("*, user:users!user_id(id, full_name, avatar_url)")
      .gte("end_date", monthStart)
      .lte("start_date", monthEnd)
      .order("start_date", { ascending: true }),
    supabase.from("users").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ปฏิทินวันลา</h1>
        <p className="text-sm text-muted-foreground">
          ดูและบันทึกวันหยุด/วันลาของทุกคนในทีม
        </p>
      </div>

      <LeaveCalendar
        initialLeaves={leaves ?? []}
        initialMonth={today}
        users={users ?? []}
        currentUserId={session.id}
        canManageAny={isManagerOrAdmin(session.profile)}
      />
    </div>
  );
}
