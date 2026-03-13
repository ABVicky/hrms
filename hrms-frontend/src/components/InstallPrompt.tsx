"use client";

import { useState, useEffect } from "react";
import { Share, Download, X } from "lucide-react";

export default function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "other">("other");

    useEffect(() => {
        // Check if iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isStandalone) {
            setPlatform("ios");
            // Show prompt after a short delay
            const timer = setTimeout(() => setShowPrompt(true), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[110] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-bottom-full duration-500">
            <button 
                onClick={() => setShowPrompt(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
                <X size={20} className="text-slate-400" />
            </button>

            <div className="flex gap-4">
                <div className="shrink-0 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">Install HRMS App</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        {platform === "ios" ? (
                            <>Tap <Share size={16} className="inline mx-1 text-indigo-600" /> and then <span className="font-bold text-slate-800">"Add to Home Screen"</span> for the best experience.</>
                        ) : (
                            "Install this app on your device for quick access and offline features."
                        )}
                    </p>
                </div>
            </div>
            
            {platform !== "ios" && (
                <button 
                    onClick={() => setShowPrompt(false)}
                    className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Download size={18} />
                    Install Now
                </button>
            )}
        </div>
    );
}
