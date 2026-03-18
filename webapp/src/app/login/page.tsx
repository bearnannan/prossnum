"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

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
                            autoComplete="username"
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
                            autoComplete="current-password"
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

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => signIn("line", { callbackUrl: "/" })}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-900"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#06C755">
                            <path d="M21 10.32c0-4.507-4.038-8.161-9-8.161s-9 3.654-9 8.161c0 4.041 3.201 7.413 7.545 8.041.294.062.693.194.793.447.091.23.059.589.029.819l-.173 1.041c-.021.129-.101.503.437.275.539-.228 2.906-1.71 3.961-2.927.012-.014.024-.028.035-.042 3.033-.919 5.374-3.834 5.374-7.653zm-11.859 2.955c-.244 0-.441-.197-.441-.441v-3.351h-.963c-.244 0-.441-.197-.441-.441s.197-.441.441-.441h2.845c.244 0 .441.197.441.441s-.197.441-.441.441h-.963v3.351c0 .244-.197.441-.441.441zm3.179 0c-.244 0-.441-.197-.441-.441v-3.792c0-.244.197-.441.441-.441s.441.197.441.441v3.792c0 .244-.197.441-.441.441zm4.194 0h-2.522c-.244 0-.441-.197-.441-.441v-3.792c0-.244.197-.441.441-.441s.441.197.441.441v3.351h2.081c.244 0 .441.197.441.441s-.197.441-.441.441zm3.178 0h-2.522c-.244 0-.441-.197-.441-.441v-3.792c0-.244.197-.441.441-.441s.441.197.441.441v.441h2.081c.244 0 .441.197.441.441s-.197.441-.441.441h-2.081v1.168h2.081c.244 0 .441.197.441.441s-.197.441-.441.441h-2.081v1.168h2.081c.244 0 .441.197.441.441s-.197.441-.441.441z" />
                        </svg>
                        Sign in with LINE
                    </button>
                </form>

                {/* Footer links */}
                <div className="mt-6 flex items-center justify-center gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                    <Link href="/privacy-policy" className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                        นโยบายความเป็นส่วนตัว
                    </Link>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <Link href="/terms-of-use" className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                        ข้อกำหนดการใช้งาน
                    </Link>
                </div>
            </div>
        </div>
    );
}
