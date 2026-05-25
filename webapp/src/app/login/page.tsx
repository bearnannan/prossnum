"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { logClientActivity } from "@/lib/client-activity";

export default function LoginPage() {
    const [district, setDistrict] = useState("");
    const [pin, setPin] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLineLoading, setIsLineLoading] = useState(false);
    const router = useRouter();

    // Auto-login if credentials were submitted in query params before JS hydration
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const authError = params.get("error");
            if (authError) {
                logClientActivity({
                    eventType: "failed_auth",
                    eventName: "line_oauth_failed",
                    targetType: "auth_provider",
                    targetLabel: "line",
                    metadata: {
                        error: authError,
                        errorDescription: params.get("error_description"),
                    },
                });
            }
            const urlDistrict = params.get("district");
            const urlPin = params.get("pin");
            if (urlDistrict && urlPin) {
                setDistrict(urlDistrict);
                setPin(urlPin);
                
                const autoLogin = async () => {
                    setError("");
                    setIsLoading(true);
                    try {
                        const res = await fetch("/api/auth", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ district: urlDistrict, pin: urlPin }),
                        });

                        if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.error || "Invalid PIN");
                        }

                        // Redirect to home and refresh session
                        router.push("/");
                        router.refresh();
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setIsLoading(false);
                    }
                };
                autoLogin();
            }
        }
    }, [router]);

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

    // PIN strength visual (0-4 steps)
    const pinStrength = Math.min(4, pin.length);

    return (
    <div className="min-h-screen flex flex-col relative overflow-hidden login-page">
            {/* ═══ Neon Orbs ═══ */}
            <div className="login-orb login-orb-1" />
            <div className="login-orb login-orb-2" />
            <div className="login-orb login-orb-3" />

            {/* ═══ Subtle Cyan Grid ═══ */}
            <div 
                className="fixed inset-0 z-[1] pointer-events-none"
                style={{
                    backgroundImage: 
                        'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* ═══ Main Content ═══ */}
            <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
                <div 
                    className="w-full max-w-[420px] animate-fade-in-up"
                    style={{ animationDuration: '0.6s' }}
                >
                    {/* ═══ Auth Card ═══ */}
                    <div 
                        className="login-card rounded-[24px] overflow-hidden geo-corner"
                    >
                        {/* ── Branding Header ── */}
                        <div className="p-8 pb-2 text-center">
                            {/* Hexagon Logo — neon cyan */}
                            <div 
                                className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 animate-float shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,240,255,0.3))',
                                    border: '1px solid rgba(0,240,255,0.35)',
                                    animationDuration: '4s' 
                                }}
                            >
                                <svg width="28" height="28" viewBox="0 0 40 44" fill="none">
                                    <polygon points="20,2 38,12 38,32 20,42 2,32 2,12"
                                        stroke="#00f0ff" strokeWidth="2" fill="rgba(0,240,255,0.1)" 
                                        style={{ filter: "drop-shadow(0 0 4px rgba(0,240,255,0.6))" }} />
                                    <circle cx="20" cy="22" r="4" fill="#00f0ff" 
                                        style={{ filter: "drop-shadow(0 0 6px rgba(0,240,255,0.8))" }} />
                                </svg>
                            </div>
                            <h1 
                                className="text-2xl font-extrabold tracking-wider text-white mb-1 neon-text-cyan"
                                style={{ 
                                    fontFamily: 'var(--font-display)',
                                    animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both',
                                }}
                            >
                                PROSSNUM
                            </h1>
                            <p 
                                className="text-xs text-slate-400 font-bold tracking-widest uppercase"
                                style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}
                            >
                                Infrastructure Progress Dashboard
                            </p>
                        </div>

                        {/* ── Login Form ── */}
                        <div className="px-8 py-6">
                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Error Message */}
                                {error && (
                                    <div 
                                        className="rounded-xl p-3.5 text-sm font-medium flex items-center gap-2.5"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#fca5a5',
                                            animation: 'fadeInUp 0.3s ease',
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                        {error}
                                    </div>
                                )}

                                {/* District Input */}
                                <div 
                                    className="space-y-2"
                                    style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
                                >
                                    <label htmlFor="district" className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] ml-1">
                                        Username / Email / District
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-neon-cyan transition-colors duration-200">
                                            location_on
                                        </span>
                                        <input
                                            id="district"
                                            name="district"
                                            type="text"
                                            required
                                            placeholder="admin"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            autoComplete="username"
                                            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all duration-300"
                                            style={{
                                                background: 'rgba(10, 10, 15, 0.60)',
                                                border: '1px solid rgba(0, 240, 255, 0.20)',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgba(0, 240, 255, 0.50)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 240, 255, 0.10)';
                                                e.target.style.background = 'rgba(10, 10, 15, 0.80)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(0, 240, 255, 0.20)';
                                                e.target.style.boxShadow = 'none';
                                                e.target.style.background = 'rgba(10, 10, 15, 0.60)';
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* PIN Input */}
                                <div 
                                    className="space-y-2"
                                    style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}
                                >
                                    <label htmlFor="pin" className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] ml-1">
                                        Password / PIN
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-neon-cyan transition-colors duration-200">
                                            lock
                                        </span>
                                        <input
                                            id="pin"
                                            name="pin"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="••••••"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            autoComplete="current-password"
                                            className="w-full rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all duration-300"
                                            style={{
                                                background: 'rgba(10, 10, 15, 0.60)',
                                                border: '1px solid rgba(0, 240, 255, 0.20)',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgba(0, 240, 255, 0.50)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 240, 255, 0.10)';
                                                e.target.style.background = 'rgba(10, 10, 15, 0.80)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(0, 240, 255, 0.20)';
                                                e.target.style.boxShadow = 'none';
                                                e.target.style.background = 'rgba(10, 10, 15, 0.60)';
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-200 p-1"
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                    {/* PIN Strength Indicator */}
                                    {pin.length > 0 && (
                                        <div className="flex gap-1 px-1 mt-1">
                                            {[0, 1, 2, 3].map(i => (
                                                <div
                                                    key={i}
                                                    className="h-[3px] flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        background: i < pinStrength 
                                                            ? pinStrength <= 2 
                                                                ? 'rgba(240, 232, 0, 0.7)' 
                                                                : 'rgba(0, 255, 136, 0.7)'
                                                            : 'rgba(0, 240, 255, 0.08)',
                                                        boxShadow: i < pinStrength
                                                            ? pinStrength <= 2
                                                                ? '0 0 6px rgba(240, 232, 0, 0.4)'
                                                                : '0 0 6px rgba(0, 255, 136, 0.4)'
                                                            : 'none',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Remember + Forgot */}
                                <div 
                                    className="flex items-center justify-between pt-1"
                                    style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <input id="remember" name="remember" type="checkbox" className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-blue-500" />
                                        <label htmlFor="remember" className="text-xs text-white/35 font-medium">Remember me</label>
                                    </div>
                                    <a href="#" className="text-xs font-semibold text-neon-cyan/50 hover:text-neon-cyan transition-colors duration-200">Forgot PIN?</a>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl font-black shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.98] text-dark-base text-sm relative overflow-hidden group"
                                    style={{ 
                                        background: '#00f0ff',
                                        animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both' 
                                    }}
                                >
                                    {/* Shine effect on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                                        style={{
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 2s ease-in-out infinite',
                                        }}
                                    />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>

                            {/* ── Divider ── */}
                            <div 
                                className="relative my-7"
                                style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}
                            >
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="px-4 text-white/25 font-bold tracking-[0.2em]" style={{ background: 'transparent' }}>
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            {/* ── LINE Sign In ── */}
                            <button
                                type="button"
                                disabled={isLineLoading || isLoading}
                                onClick={() => {
                                    setIsLineLoading(true);
                                    signIn("line", { callbackUrl: "/" });
                                }}
                                className="w-full py-3.5 rounded-xl font-bold text-sm shadow-premium-sm transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] hover:shadow-premium-md text-white relative overflow-hidden group disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #06C755, #04A847)',
                                    animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both',
                                }}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 2s ease-in-out infinite',
                                    }}
                                />
                                {isLineLoading ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : (
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOsb_L3Wjo1XwY4nbYDNg7t-9jqfeYPKn3G9RypRixEYvObdb-zMF9MXSU8-cKsUYP_G5rd-ZmwezdnIvTN3PDz8mXdSTCsUycYyXfVPmRVyUtcNeM0q0P3MTjykpYLzlq_U-ZdA9bxP0iwy4dNW-60cStijjoQsdJIJkVQ0zwrVIc2n9NBdGusjdeDMgKDUJL_k_kbMKtcc8T5MsXHzfRQBEGgLHhgk3iuXztixoGgARL0ZHNwkz-fIDpJxjR5noWkUW5TVevXeM"
                                        alt="LINE"
                                        className="w-5 h-5 filter brightness-0 invert relative z-10"
                                    />
                                )}
                                <span className="relative z-10">{isLineLoading ? "Connecting..." : "Sign in with LINE"}</span>
                            </button>
                        </div>

                        {/* ── Card Footer ── */}
                        <div 
                            className="px-8 py-5 text-center"
                            style={{
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s both',
                            }}
                        >
                            <p className="text-xs text-white/25 font-medium">
                                Authorized personnel only.{" "}
                                <a href="#" className="text-blue-400/50 hover:text-blue-400 font-semibold transition-colors duration-200">Contact Support</a>
                            </p>
                        </div>
                    </div>

                    {/* ═══ Version Badge ═══ */}
                    <div 
                        className="text-center mt-6"
                        style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s both' }}
                    >
                        <span className="text-[10px] font-bold text-white/15 tracking-widest uppercase">ProssNum v5.0</span>
                    </div>
                </div>
            </main>

            {/* ═══ Footer ═══ */}
            <footer className="relative z-10 py-6 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-white/15">
                        <span className="material-symbols-outlined text-sm">copyright</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">2026 Infrastructure Progress</span>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/privacy-policy" className="text-[10px] font-semibold text-white/20 hover:text-white/50 transition-colors duration-200 uppercase tracking-widest">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-of-use" className="text-[10px] font-semibold text-white/20 hover:text-white/50 transition-colors duration-200 uppercase tracking-widest">
                            Terms of Use
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
