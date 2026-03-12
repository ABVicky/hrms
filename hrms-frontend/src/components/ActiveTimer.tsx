"use client";

import { useState, useEffect } from "react";

interface ActiveTimerProps {
    checkInTime: string;
}

export default function ActiveTimer({ checkInTime }: ActiveTimerProps) {
    const [elapsed, setElapsed] = useState("00:00:00");

    useEffect(() => {
        if (!checkInTime) {
            setElapsed("00:00:00");
            return;
        }

        const startTime = new Date(checkInTime).getTime();
        if (isNaN(startTime)) {
            setElapsed("00:00:00");
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const diff = now - startTime;
            
            if (diff < 0) {
                setElapsed("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [checkInTime]);

    return (
        <h2 className="text-4xl font-black tracking-tighter tabular-nums text-slate-900">
            {elapsed}
        </h2>
    );
}
