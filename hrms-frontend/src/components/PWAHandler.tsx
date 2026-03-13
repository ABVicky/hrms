"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function PWAHandler() {
    const [isOffline, setIsOffline] = useState(false);
    const [showOnlineToast, setShowOnlineToast] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOnlineToast(true);
            setTimeout(() => setShowOnlineToast(false), 3000);
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check
        if (!navigator.onLine) setIsOffline(true);

        // Notification permission request
        if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => {
                Notification.requestPermission();
            }, 10000); // Ask after 10s of use
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOffline) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                <WifiOff size={20} />
                <span className="font-bold text-sm">Working Offline</span>
            </div>
        );
    }

    if (showOnlineToast) {
        return (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                <Wifi size={20} />
                <span className="font-bold text-sm">Back Online!</span>
            </div>
        );
    }

    return null;
}
