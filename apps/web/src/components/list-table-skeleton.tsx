import { Skeleton } from "@/components/ui/skeleton";

type ListTableSkeletonProps = {
  rows?: number;
  showFilters?: boolean;
  showSidebar?: boolean;
};

export function ListTableSkeleton({
  rows = 6,
  showFilters = true,
  showSidebar = false,
}: ListTableSkeletonProps) {
  const grid = (
    <div className="rounded-lg border border-border bg-white">
      <div className="grid grid-cols-12 gap-3 border-b border-border px-4 py-3">
        <Skeleton className="col-span-5 h-3" />
        <Skeleton className="col-span-2 h-3" />
        <Skeleton className="col-span-2 h-3" />
        <Skeleton className="col-span-3 h-3" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-12 gap-3 px-4 py-4"
          >
            <Skeleton className="col-span-5 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-3 h-4 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!showSidebar) {
    return (
      <div className="space-y-4">
        {showFilters ? (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-white p-4">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        ) : null}
        {grid}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-lg border border-border bg-white p-4">
        <Skeleton className="h-3 w-20" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`nav-${index}`} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <section className="space-y-4">
        {showFilters ? (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-white p-4">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        ) : null}
        {grid}
      </section>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`field-${index}`} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`card-${index}`}
          className="rounded-lg border border-border bg-white p-4"
        >
          <Skeleton className="h-4 w-2/3 max-w-sm" />
          <Skeleton className="mt-2 h-3 w-full max-w-md" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
