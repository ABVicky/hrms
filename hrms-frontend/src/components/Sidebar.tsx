"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Megaphone,
    MapPin,
    CalendarOff,
    Receipt,
    Users,
    Settings,
    User,
    Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const pathname = usePathname();
    const { user, attendanceStatus } = useAuth();

    if (!user) return null;

    const getNavItems = () => {
        const baseItems = [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
            { name: "Attendance", href: "/dashboard/attendance", icon: MapPin },
            { name: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
            { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
            { name: "Work", href: "/dashboard/work", icon: Briefcase },
        ];

        if (user.role === "Super Admin" || user.role === "HR Admin") {
            baseItems.push({ name: "Employees", href: "/dashboard/employees", icon: Users });
        }

        // Salary module visibility
        if (user.role === "Super Admin" || user.department === "Finance" || user.role === "Employee" || user.role === "Manager") {
            baseItems.push({ name: "Salary", href: "/dashboard/salary", icon: Receipt });
        }

        baseItems.push({ name: "Settings", href: "/dashboard/settings", icon: Settings });
        return baseItems;
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
                <div className="flex items-center justify-between px-6 h-24 border-b border-slate-900">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            alt="HRMS Logo" 
                            className="w-10 h-10 object-contain"
                        />
                        <span className="font-black text-xl tracking-tight text-white uppercase">HRMS<span className="text-indigo-500">.</span></span>
                    </div>

                </div>

                <nav className="flex-1 px-5 py-10 space-y-2.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden ${isActive
                                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] font-extrabold translate-x-2"
                                    : "hover:bg-slate-900/50 hover:text-white font-bold text-slate-400 hover:translate-x-1"
                                    }`}
                            >
                                {isActive && <div className="absolute left-0 top-0 w-1.5 h-full bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>}
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-slate-600 group-hover:text-indigo-400 transition-colors"} />
                                <span className="tracking-tight">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User preview */}
                <div className="mt-auto p-6">
                    <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-indigo-500/30">
                        {/* Soft Glow */}
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative shrink-0">
                                {user.profile_picture ? (
                                    <img 
                                        src={getImageUrl(user.profile_picture)} 
                                        alt="" 
                                        className="absolute inset-0 w-12 h-12 rounded-[1.2rem] object-cover ring-2 ring-slate-800 shadow-xl z-10 transition-all duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0';
                                        }}
                                        onLoad={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '1';
                                        }}
                                    />
                                ) : null}
                                <div className="w-12 h-12 rounded-[1.2rem] bg-slate-800 text-slate-500 flex items-center justify-center ring-1 ring-slate-700">
                                    <User size={24} strokeWidth={2.5} />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-4 h-4 border-[3.5px] border-slate-950 rounded-full shadow-lg z-20 transition-all duration-700 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500 shadow-rose-500/20' : 
                                    'bg-slate-600'
                                }`}></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-black text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors">{user.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
