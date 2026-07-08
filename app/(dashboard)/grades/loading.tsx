import { Skeleton } from "@/components/ui/skeleton";

export default function GradesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
