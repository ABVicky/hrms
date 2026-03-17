"use client";

import { RefreshCcw, Sparkles, X } from "lucide-react";
import { usePWA } from "@/contexts/PWAContext";
import { useState, useEffect } from "react";

export default function PWAUpdatePrompt() {
    const { swUpdateAvailable, updateApp } = usePWA();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (swUpdateAvailable) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [swUpdateAvailable]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-md animate-in slide-in-from-top-full duration-500">
            <div className="bg-white/80 backdrop-blur-xl border border-rose-100 p-4 rounded-3xl shadow-[0_20px_50px_rgba(225,29,72,0.15)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center relative">
                        <Sparkles className="text-rose-600 animate-pulse" size={24} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Update Available</h4>
                        <p className="text-slate-500 text-xs">Fresh version of ASPIRE is ready!</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                    >
                        <X size={18} />
                    </button>
                    <button 
                        onClick={updateApp}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-rose-200 flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <RefreshCcw size={16} className="animate-spin-slow" />
                        Update
                    </button>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
