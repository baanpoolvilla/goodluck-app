import Link from "next/link";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const { profile } = session;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ตั้งค่าส่วนตัว</h1>

      <Card>
        <CardHeader>
          <CardTitle>โปรไฟล์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">ชื่อ: </span>
            {profile.full_name}
          </div>
          <div>
            <span className="text-muted-foreground">อีเมล: </span>
            {profile.email}
          </div>
          <div>
            <span className="text-muted-foreground">แผนก: </span>
            {profile.department ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">สิทธิ์: </span>
            <span className="capitalize">{profile.role}</span>
          </div>
          <div>
            <span className="text-muted-foreground">LINE: </span>
            {profile.line_user_id ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
          </div>
        </CardContent>
      </Card>

      {isAdmin(profile) && (
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/settings/grading" className={buttonVariants({ variant: "outline" })}>
              ตั้งค่าการตัดเกรด
            </Link>
            <Link href="/hub" className={buttonVariants({ variant: "outline" })}>
              จัดการ App Hub
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
