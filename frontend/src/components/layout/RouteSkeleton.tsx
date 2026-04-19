import { Skeleton } from "@/components/ui/skeleton";

export function RouteSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}
