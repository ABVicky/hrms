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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
            <div className="relative">
                {/* Subtle top glow line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                
                <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-2 pt-1 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-around h-16">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex-1 flex flex-col items-center justify-center transition-all duration-300 relative active:scale-90 ${isActive ? "text-indigo-600" : "text-slate-400"
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute top-[-5px] w-12 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)] animate-in fade-in zoom-in duration-500"></div>
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
