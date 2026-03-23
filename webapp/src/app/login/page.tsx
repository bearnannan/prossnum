"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const [district, setDistrict] = useState("");
    const [pin, setPin] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="bg-surface text-on-surface min-h-screen flex flex-col architectural-bg">
            <main className="flex-grow flex items-center justify-center px-4 py-12">
                {/* Auth Card Container */}
                <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl shadow-[0px_12px_24px_rgba(25,28,29,0.06)] overflow-hidden">
                    {/* Branding Header */}
                    <div className="p-8 pb-4 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container text-on-primary-fixed-variant rounded-xl mb-6">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
                        </div>
                        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Progress Dashboard</h1>
                        <p className="font-body text-on-surface-variant mt-2 text-sm">Enter your credentials to access the project hub.</p>
                    </div>

                    {/* Login Form */}
                    <div className="px-8 py-6">
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* District Input */}
                            <div className="space-y-2">
                                <label htmlFor="district" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                                    District / อำเภอ
                                </label>
                                <div className="relative">
                                    <input
                                        id="district"
                                        name="district"
                                        type="text"
                                        required
                                        placeholder="Select your district"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        autoComplete="username"
                                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* PIN Code Input */}
                            <div className="space-y-2">
                                <label htmlFor="pin" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                                    PIN Code
                                </label>
                                <div className="relative">
                                    <input
                                        id="pin"
                                        name="pin"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        autoComplete="current-password"
                                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center">
                                    <input id="remember" name="remember" type="checkbox" className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-on-surface-variant">Remember me</label>
                                </div>
                                <a href="#" className="text-sm font-semibold text-primary hover:underline">Forgot PIN?</a>
                            </div>

                            {/* Primary Sign In */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-on-primary font-headline font-bold py-3.5 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                                <span className="material-symbols-outlined text-lg">login</span>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-outline-variant/30"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-bold tracking-[0.2em]">OR CONTINUE WITH</span>
                            </div>
                        </div>

                        {/* Social Sign In */}
                        <button
                            type="button"
                            onClick={() => signIn("line", { callbackUrl: "/" })}
                            className="w-full bg-[#06C755] text-white font-headline font-bold py-3.5 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOsb_L3Wjo1XwY4nbYDNg7t-9jqfeYPKn3G9RypRixEYvObdb-zMF9MXSU8-cKsUYP_G5rd-ZmwezdnIvTN3PDz8mXdSTCsUycYyXfVPmRVyUtcNeM0q0P3MTjykpYLzlq_U-ZdA9bxP0iwy4dNW-60cStijjoQsdJIJkVQ0zwrVIc2n9NBdGusjdeDMgKDUJL_k_kbMKtcc8T5MsXHzfRQBEGgLHhgk3iuXztixoGgARL0ZHNwkz-fIDpJxjR5noWkUW5TVevXeM"
                                alt="LINE"
                                className="w-5 h-5 filter brightness-0 invert"
                            />
                            Sign in with LINE
                        </button>
                    </div>

                    {/* Card Footer */}
                    <div className="bg-surface-container-low p-6 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Authorized personnel only. Need help?{" "}
                            <a href="#" className="text-primary font-semibold hover:underline">Contact Support</a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Global Footer */}
            <footer className="py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                        <span className="material-symbols-outlined text-sm">copyright</span>
                        <span className="text-xs font-medium uppercase tracking-widest">2024 Infrastructure Progress</span>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/privacy-policy" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-of-use" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
                            Terms of Use
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
