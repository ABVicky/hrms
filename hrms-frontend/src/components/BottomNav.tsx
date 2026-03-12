"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, CalendarOff, Receipt, Menu } from "lucide-react";

export default function BottomNav({ setIsSidebarOpen }: { setIsSidebarOpen: (val: boolean) => void }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: "/dashboard/attendance", icon: MapPin },
        { name: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
        { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    ];

    return (
        <div className="md:hidden fixed bottom-4 left-6 right-6 z-20">
            <div className="glass-effect rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 px-6 py-4">
                <div className="flex items-center justify-around">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center transition-all duration-300 relative ${isActive ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-indigo-400"
                                    }`}
                            >
                                <Icon size={24} className={isActive ? "stroke-[2.5]" : "stroke-[2]"} />
                                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 transition-all duration-300"
                    >
                        <Menu size={24} className="stroke-[2]" />
                        <span className="text-[10px] font-black uppercase tracking-tighter mt-1 opacity-40">Menu</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
