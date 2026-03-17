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

import { APP_VERSION } from "@/constants/version";

export const PWAProvider = ({ children }: { children: React.ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        // Version checking logic
        const checkVersionMismatch = async () => {
            try {
                // Fetch version.json with cache-busting
                const response = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (!response.ok) return;
                
                const data = await response.json();
                const latestVersion = data.version;

                if (latestVersion && latestVersion !== APP_VERSION) {
                    console.log(`[Version] Mismatch detected: local ${APP_VERSION} vs remote ${latestVersion}`);
                    setSwUpdateAvailable(true);
                    
                    // Proactively trigger SW update
                    if (registration) {
                        registration.update();
                    }
                }
            } catch (error) {
                console.error("[Version] Failed to check for updates:", error);
            }
        };

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);
        if (ios) {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) setIsInstallable(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Service Worker Update detection
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);

                // Initial check
                reg.update();
                checkVersionMismatch();

                // Check for updates periodically (more frequent for sync)
                const interval = setInterval(() => {
                    console.log("[PWA] Running periodic update check...");
                    reg.update();
                    checkVersionMismatch();
                }, 5 * 60 * 1000); // 5 minutes check

                // Aggressive check on window focus or visibility change
                const handleUpdateCheck = () => {
                    if (document.visibilityState === "visible") {
                        reg.update();
                        checkVersionMismatch();
                    }
                };

                window.addEventListener("focus", handleUpdateCheck);
                window.addEventListener("visibilitychange", handleUpdateCheck);

                reg.addEventListener("updatefound", () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                setSwUpdateAvailable(true);
                            }
                        });
                    }
                });

                return () => {
                    clearInterval(interval);
                    window.removeEventListener("focus", handleUpdateCheck);
                    window.removeEventListener("visibilitychange", handleUpdateCheck);
                };
            });

            // Handle automatic reload when a new service worker takes over
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, [registration]);

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
        // If we have a waiting service worker, skip waiting to trigger reload
        if (registration && registration.waiting) {
            const loadingToast = toast.loading("Updating app...");
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
            toast.success("Updating...", { id: loadingToast });
            return;
        }

        // If no waiting service worker but version mismatch exists, force refresh
        // This handles cases where SW update is stuck or not yet detected as 'waiting'
        const loadingToast = toast.loading("Force refreshing app...");
        
        // Unregister all service workers and reload as absolute fallback
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (let registration of registrations) {
                    registration.unregister();
                }
                toast.success("Refreshing...", { id: loadingToast });
                window.location.href = window.location.origin + '?v=' + Date.now();
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
