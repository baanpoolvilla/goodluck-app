"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ChannelMeta } from "@/lib/reports/channels";

export function ChannelSidebar({ channels }: { channels: ChannelMeta[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
      {channels.map((c) => {
        const href = `/reports/${c.value}`;
        const active = pathname === href;
        const Icon = c.icon;
        return (
          <Link
            key={c.value}
            href={href}
            className={cn(
              "group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "gradient-primary text-white shadow-md shadow-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform",
                active ? "scale-105" : "group-hover:scale-105"
              )}
            />
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
