import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-72 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 p-3">
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
