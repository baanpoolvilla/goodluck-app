import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { UserAdminTable } from "@/components/settings/user-admin-table";

export default async function UsersAdminPage() {
  const session = await getSessionUser();
  if (!session || !isAdmin(session.profile)) redirect("/settings");

  const supabase = await createClient();
  const { data: users } = await supabase.from("users").select("*").order("full_name");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับไปที่ตั้งค่า
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">จัดการผู้ใช้งาน</h1>
        <p className="text-sm text-muted-foreground">
          กำหนดสิทธิ์ (role) และ channel รายงาน (IT / Marketing / Admin / Housekeeper) ให้แต่ละคน
        </p>
      </div>

      <UserAdminTable users={users ?? []} />
    </div>
  );
}
