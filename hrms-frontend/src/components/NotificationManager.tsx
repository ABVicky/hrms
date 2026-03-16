"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";

export default function NotificationManager() {
    const { user, isAuthenticated } = useAuth();
    const lastNotifIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Initial permission request
        const requestPermission = async () => {
            if ("Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission();
            }
        };
        requestPermission();
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user?.employee_id) {
            // Clear badge on logout
            if ('clearAppBadge' in navigator) {
                (navigator as any).clearAppBadge();
            }
            return;
        }

        const storedLastId = localStorage.getItem(`last_notif_id_${user.employee_id}`);
        lastNotifIdRef.current = storedLastId;

        const checkNewNotifications = async () => {
            try {
                const notifications = await appsScriptFetch("/get-notifications", { 
                    employee_id: user.employee_id,
                    department: user.department 
                });

                if (!notifications) return;

                const unreadCount = notifications.filter((n: any) => !n.read).length;

                // Update App Badge (PWA Icon number)
                if ('setAppBadge' in navigator && unreadCount > 0) {
                    (navigator as any).setAppBadge(unreadCount).catch(() => {});
                } else if ('clearAppBadge' in navigator) {
                    (navigator as any).clearAppBadge().catch(() => {});
                }

                if (notifications.length === 0) return;

                const latest = notifications[0];

                // If it's a new ID and it's unread
                if (latest.id !== lastNotifIdRef.current && !latest.read) {
                    
                    lastNotifIdRef.current = latest.id;
                    localStorage.setItem(`last_notif_id_${user.employee_id}`, latest.id);

                    if (Notification.permission === "granted") {
                        // Use ServiceWorker if available for better PWA background support
                        const showNotification = async () => {
                            const options = {
                                body: latest.message,
                                icon: "/icon-192x192.png",
                                tag: latest.id,
                                badge: "/favicon.png",
                                data: { url: latest.target_path || "/dashboard" },
                                vibrate: [100, 50, 100]
                            };

                            if ('serviceWorker' in navigator) {
                                const registration = await navigator.serviceWorker.ready;
                                if (registration && 'showNotification' in registration) {
                                    registration.showNotification(`ASPIRE: ${latest.title}`, options);
                                    return;
                                }
                            }
                            
                            // Fallback to standard notification
                            const notif = new Notification(`ASPIRE: ${latest.title}`, options);
                            notif.onclick = () => {
                                window.focus();
                                if (latest.target_path) window.location.href = latest.target_path;
                                notif.close();
                            };
                        };

                        showNotification();

                        // Sound alert
                        try {
                            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                            audio.volume = 0.4;
                            audio.play();
                        } catch (e) {}
                    }
                } else if (latest.id !== lastNotifIdRef.current) {
                    lastNotifIdRef.current = latest.id;
                    localStorage.setItem(`last_notif_id_${user.employee_id}`, latest.id);
                }

            } catch (err) {
                console.error("Notification sync error:", err);
            }
        };

        const pollInterval = setInterval(checkNewNotifications, 5000);
        checkNewNotifications();

        return () => clearInterval(pollInterval);
    }, [isAuthenticated, user]);

    return null;
}
