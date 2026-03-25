import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonLayout({ type }: { type: 'grid' | 'table' | 'chart' }) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }
  
  if (type === 'table') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="h-full w-full flex flex-col gap-4">
        <div className="flex items-end gap-2 h-full">
            <Skeleton className="h-[40%] flex-1" />
            <Skeleton className="h-[70%] flex-1" />
            <Skeleton className="h-[50%] flex-1" />
            <Skeleton className="h-[90%] flex-1" />
            <Skeleton className="h-[60%] flex-1" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return null;
}
