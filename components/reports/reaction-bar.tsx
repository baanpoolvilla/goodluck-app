"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { REACTION_EMOJIS } from "@/lib/validation/reports";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/db/database.types";

type ReportReaction = Database["public"]["Tables"]["report_reactions"]["Row"];

export function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
}: {
  reactions: ReportReaction[];
  currentUserId: string;
  onToggle: (emoji: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const groups = REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.emoji === emoji).length,
    mine: reactions.some((r) => r.emoji === emoji && r.user_id === currentUserId),
  })).filter((g) => g.count > 0);

  async function handleToggle(emoji: string) {
    if (pending) return;
    setPending(true);
    setOpen(false);
    try {
      await onToggle(emoji);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map((g) => (
        <button
          key={g.emoji}
          type="button"
          disabled={pending}
          onClick={() => handleToggle(g.emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            g.mine
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-transparent bg-muted hover:bg-accent"
          )}
        >
          <span>{g.emoji}</span>
          <span>{g.count}</span>
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label="เพิ่ม reaction" />}
        >
          <SmilePlus className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5">
          <div className="flex gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={pending}
                onClick={() => handleToggle(emoji)}
                className="rounded-lg p-1.5 text-lg transition-transform hover:scale-125 hover:bg-accent"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
