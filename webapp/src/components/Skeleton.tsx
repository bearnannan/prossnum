import React from "react";
import { cn } from "@/lib/utils";
import { OrbitRing } from "./loading-ui/OrbitRing";
import { TextShimmer } from "./loading-ui/TextShimmer";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 relative overflow-hidden animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonLayout({ type }: { type: 'grid' | 'table' | 'chart' }) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl" />
        ))}
      </div>
    );
  }
  
  if (type === 'table') {
    return (
      <div className="space-y-3">
        <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl ml-auto" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="h-full w-full flex flex-col gap-6 p-4">
        <div className="flex items-end gap-3 h-full px-2">
            <Skeleton className="h-[30%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[60%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[45%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[80%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[55%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[40%] flex-1 rounded-t-lg" />
            <Skeleton className="h-[75%] flex-1 rounded-t-lg" />
        </div>
        <div className="flex justify-between px-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
        </div>
      </div>
    );
  }

  return null;
}

export function PremiumDashboardSkeleton() {
  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-950/80 min-h-screen">
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-50">
        <div className="relative">
          <OrbitRing className="size-16 text-blue-500/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <TextShimmer className="text-xl font-bold tracking-tight text-zinc-500 dark:text-zinc-400" duration={1.5}>
            PROSSNUM
          </TextShimmer>
          <TextShimmer className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400/60" duration={2}>
            Architectural Dashboard
          </TextShimmer>
        </div>
      </div>
      
      {/* Background Skeletons to maintain layout feel */}
      <div className="p-8 space-y-8 opacity-20 pointer-events-none">
        <div className="h-20 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6 h-[400px]">
          <div className="col-span-4 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          <div className="col-span-8 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
