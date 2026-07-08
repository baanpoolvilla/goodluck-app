"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { NavItem } from "@/components/layout/nav-config";

export function Topbar({
  fullName,
  role,
  items,
}: {
  fullName: string;
  role: string;
  items: NavItem[];
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="เปิดเมนู" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="gradient-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                <Sparkles className="size-3.5 text-white" />
              </div>
              Company Ops
            </SheetTitle>
            <div className="mt-4">
              <SidebarNav items={items} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="gradient-text font-semibold md:hidden">Company Ops</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="flex items-center gap-2 rounded-full px-2" />}
          >
            <Avatar className="size-7 ring-2 ring-primary/20">
              <AvatarFallback className="gradient-primary text-[11px] font-semibold text-white">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              {fullName}
              <div className="mt-1">
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 size-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
