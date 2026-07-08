import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isManagerOrAdmin } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskBoard } from "@/components/tasks/task-board";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await getSessionUser();
  if (!session) return null;

  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, assignee:users!assigned_to(id, full_name)")
    .order("deadline", { ascending: true });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data: tasks } = await query;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมงานทั้งหมด แบ่งตามสถานะ</p>
        </div>
        {isManagerOrAdmin(session.profile) && (
          <Link href="/tasks/new" className={buttonVariants({ className: "gradient-primary border-0" })}>
            <Plus className="mr-2 size-4" />
            สร้างงานใหม่
          </Link>
        )}
      </div>

      <TaskFilters />
      <TaskBoard tasks={tasks ?? []} />
    </div>
  );
}
