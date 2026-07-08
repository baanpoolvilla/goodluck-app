import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskTable } from "@/components/tasks/task-table";
import type { TaskStatus } from "@/lib/db/database.types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const session = await getSessionUser();
  if (!session) return null;

  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, assignee:users!assigned_to(id, full_name)")
    .order("deadline", { ascending: true });

  if (status) query = query.eq("status", status as TaskStatus);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: tasks } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        {isManagerOrAdmin(session.profile) && (
          <Link href="/tasks/new" className={buttonVariants()}>
            <Plus className="mr-2 size-4" />
            สร้างงานใหม่
          </Link>
        )}
      </div>

      <TaskFilters />
      <TaskTable tasks={tasks ?? []} />
    </div>
  );
}
