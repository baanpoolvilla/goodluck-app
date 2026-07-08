"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/nav-config";

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/60 bg-background/90 backdrop-blur-md md:hidden">
      {items.slice(0, 5).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px]"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-all",
                active ? "gradient-primary text-white shadow-md shadow-primary/30" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className={cn(active ? "font-medium text-primary" : "text-muted-foreground")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
