"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// next/dynamic with ssr:false must be called from a Client Component —
// this thin wrapper exists purely so the dashboard page (a Server
// Component) can still code-split the recharts bundle out of its payload.
export const MonthlyTrendChart = dynamic(
  () => import("@/components/dashboard/monthly-trend-chart").then((m) => m.MonthlyTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-[276px] w-full rounded-xl" /> }
);
