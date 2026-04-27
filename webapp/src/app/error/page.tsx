"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 font-sans dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                    Something went wrong
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                    {error === "Configuration" 
                        ? "There's a problem with the server configuration. Please check the environment variables." 
                        : error || "An unexpected error occurred during authentication."}
                </p>
                <div className="space-y-3">
                    <Link 
                        href="/login"
                        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
