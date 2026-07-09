import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelReportsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
