"use client";

import { useEffect } from "react";

export default function NotificationManager() {
    useEffect(() => {
        const setupNotifications = async () => {
            if (!("Notification" in window)) {
                console.log("This browser does not support push notifications.");
                return;
            }

            if (Notification.permission === "default") {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    new Notification("Welcome! Notifications enabled.", {
                        body: "You will now receive important updates here.",
                        icon: "/icon-192x192.png" // Assumes standard PWA icon path
                    });
                }
            } else if (Notification.permission === "granted") {
                console.log("Notification permission already granted.");
            }
        };

        // Delay slightly to not overwhelm on very first paint
        const timer = setTimeout(setupNotifications, 2000);
        return () => clearTimeout(timer);
    }, []);

    return null; // This component doesn't render anything
}
