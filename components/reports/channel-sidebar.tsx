"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REPORT_CHANNELS } from "@/lib/reports/channels";
import type { ReportChannel } from "@/lib/db/database.types";

// Takes plain channel values (not the ChannelMeta objects, which carry a
// component reference in `icon`) — a Server Component can't pass a function
// as a prop into this Client Component, so the icon lookup happens here,
// client-side, against the shared REPORT_CHANNELS constant instead.
export function ChannelSidebar({ channels }: { channels: ReportChannel[] }) {
  const pathname = usePathname();
  const items = REPORT_CHANNELS.filter((c) => channels.includes(c.value));

  return (
    <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((c) => {
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
