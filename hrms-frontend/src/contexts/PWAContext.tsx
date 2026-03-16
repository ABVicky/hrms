"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface PWAContextType {
    isInstallable: boolean;
    isIOS: boolean;
    installApp: () => Promise<void>;
    updateApp: () => void;
    swUpdateAvailable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider = ({ children }: { children: React.ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);
        if (ios) {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) setIsInstallable(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Service Worker Update detection
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                setSwUpdateAvailable(true);
                                toast("Update available! Click the update button to refresh.", {
                                    icon: "🚀",
                                    duration: 5000,
                                });
                            }
                        });
                    }
                });
            });
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const installApp = async () => {
        if (isIOS) {
            toast("To install: Tap 'Share' icon and then 'Add to Home Screen' 📲", {
                duration: 6000,
                icon: '💡'
            });
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    const updateApp = () => {
        const loadingToast = toast.loading("Updating app...");
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                if (registrations.length === 0) {
                    window.location.reload();
                    return;
                }
                registrations.forEach((registration) => {
                    registration.update().then(() => {
                        toast.success("App updated! Refreshing...", { id: loadingToast });
                        setTimeout(() => window.location.reload(), 1000);
                    });
                });
            });
        } else {
            window.location.reload();
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, isIOS, installApp, updateApp, swUpdateAvailable }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
};
