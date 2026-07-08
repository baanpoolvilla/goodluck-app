import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { GradeConfigForm } from "@/components/grades/grade-config-form";

export default async function GradingSettingsPage() {
  const session = await getSessionUser();
  if (!session || !isAdmin(session.profile)) redirect("/settings");

  const supabase = await createClient();
  const { data: configs } = await supabase.from("grade_configs").select("*").order("module");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ตั้งค่าการตัดเกรด</h1>
        <p className="text-sm text-muted-foreground">
          สัดส่วนคะแนนของ Task และ Daily Report ต้องรวมกันได้ 100%
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(configs ?? []).map((c) => (
          <GradeConfigForm key={c.module} config={c} />
        ))}
      </div>
    </div>
  );
}
