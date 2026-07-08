"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function setParam(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="ค้นหาชื่องาน..."
        className="pl-9"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setParam(e.target.value);
        }}
      />
    </div>
  );
}
