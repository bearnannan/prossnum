import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export function SkeletonLayout({ type }: { type: 'grid' | 'table' | 'chart' }) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }
  
  if (type === 'table') {
    return (
      <div className="space-y-2.5">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="h-full w-full flex flex-col gap-4">
        <div className="flex items-end gap-2 h-full">
            <Skeleton className="h-[40%] flex-1" style={{ animationDelay: '0.05s' }} />
            <Skeleton className="h-[70%] flex-1" style={{ animationDelay: '0.1s' }} />
            <Skeleton className="h-[50%] flex-1" style={{ animationDelay: '0.15s' }} />
            <Skeleton className="h-[90%] flex-1" style={{ animationDelay: '0.2s' }} />
            <Skeleton className="h-[60%] flex-1" style={{ animationDelay: '0.25s' }} />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return null;
}
