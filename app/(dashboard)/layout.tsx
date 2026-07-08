import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  return <AppShell profile={session.profile}>{children}</AppShell>;
}
