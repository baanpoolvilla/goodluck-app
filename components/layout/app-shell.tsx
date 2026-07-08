"use client";

import { Sparkles } from "lucide-react";
import { visibleNavItems } from "@/components/layout/nav-config";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import type { Profile } from "@/lib/auth/session";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const items = visibleNavItems(profile.role);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="gradient-primary flex size-8 shrink-0 items-center justify-center rounded-xl shadow-md shadow-primary/30">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">Company Ops</div>
            <div className="truncate text-[11px] text-sidebar-foreground/50">& Grading</div>
          </div>
        </div>
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar fullName={profile.full_name} role={profile.role} items={items} />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
