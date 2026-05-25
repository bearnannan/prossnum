"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/lib/rbac";

interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
}

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      try {
        const response = await fetch("/api/auth/user", { cache: "no-store" });
        const json = await response.json();
        const user = json.user as AuthUser | null;

        if (!isMounted) return;
        if (response.ok && user?.role === "admin") {
          setIsAllowed(true);
          return;
        }
      } catch {
        // Redirect below.
      }

      if (isMounted) router.replace("/mission-control");
    };

    checkRole();
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isAllowed) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-dark-base bg-grid text-slate-200">
        <div className="rounded-lg border border-neon-cyan/20 bg-dark-surface/80 px-5 py-4 text-center shadow-card">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-cyan">
            Access Check
          </div>
          <div className="mt-2 text-sm font-bold text-white">Verifying admin permissions...</div>
        </div>
      </div>
    );
  }

  return children;
}
