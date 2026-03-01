"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [district, setDistrict] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ district, pin }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Invalid PIN");
            }

            // Successful login
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 font-sans dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Progress Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        Please enter your district and PIN to access the dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="district" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            District / อำเภอ
                        </label>
                        <input
                            id="district"
                            name="district"
                            type="text"
                            required
                            placeholder="e.g. อำเภอเมือง"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="pin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            PIN Code
                        </label>
                        <input
                            id="pin"
                            name="pin"
                            type="password"
                            required
                            placeholder="Enter your PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
