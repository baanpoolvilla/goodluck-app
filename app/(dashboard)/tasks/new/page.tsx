import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { TaskCreateForm } from "@/components/tasks/task-create-form";

export default async function NewTaskPage() {
  const session = await getSessionUser();
  if (!session || !isManagerOrAdmin(session.profile)) {
    redirect("/tasks");
  }

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">สร้างงานใหม่</h1>
      <TaskCreateForm users={users ?? []} />
    </div>
  );
}
