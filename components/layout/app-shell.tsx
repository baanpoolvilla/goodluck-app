"use client";

import { visibleNavItems } from "@/components/layout/nav-config";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import type { Profile } from "@/lib/auth/session";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const items = visibleNavItems(profile.role);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar p-4 md:block">
        <div className="mb-6 px-2 text-lg font-semibold text-sidebar-foreground">Company Ops</div>
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar fullName={profile.full_name} role={profile.role} items={items} />
        <main className="flex-1 p-4 pb-20 md:pb-6">{children}</main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
