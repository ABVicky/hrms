"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If already logged in, redirect to dashboard
        if (user && !loading) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="w-20 h-20 bg-white shadow-xl shadow-rose-200/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 ring-1 ring-slate-100">
                        <img src="/logo.png" alt="ASPIRE Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
                        ASPIRE Portal
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to access your dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="pl-10 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow sm:text-sm"
                                    placeholder="admin@agency.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="pl-10 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white ${loading ? "bg-rose-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                            } transition-colors shadow-md`}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
