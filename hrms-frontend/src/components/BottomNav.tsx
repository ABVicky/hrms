"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, CalendarOff, IndianRupee, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav({ setIsSidebarOpen }: { setIsSidebarOpen: (val: boolean) => void }) {
    const pathname = usePathname();

    const { user } = useAuth();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: user?.role === "Super Admin" ? "/dashboard/attendance/analytics" : "/dashboard/attendance", icon: MapPin },
        { name: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
        { name: "Expenses", href: "/dashboard/expenses", icon: IndianRupee },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
            <div className="relative">
                {/* Subtle top glow line */}
                <div className="bg-white/95 backdrop-blur-3xl border-t border-slate-100 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] rounded-t-[2rem]">
                    <div className="flex items-center justify-around h-14">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex-1 flex flex-col items-center justify-center transition-all duration-300 relative active:scale-90 ${isActive ? "text-rose-600" : "text-slate-400"
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute top-[-5px] w-12 h-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.3)] animate-in fade-in zoom-in duration-500"></div>
                                    )}
                                    <div className={`p-1.5 transition-all duration-300 ${isActive ? 'translate-y-[-2px]' : ''}`}>
                                        <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-[2]"} />
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? "opacity-100 translate-y-[-2px]" : "opacity-50"}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex-1 flex flex-col items-center justify-center text-slate-400 active:scale-90 transition-all duration-300"
                        >
                            <div className="p-1.5">
                                <Menu size={22} className="stroke-[2]" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">Menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
