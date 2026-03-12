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
        ];

        if (user.role === "Super Admin" || user.role === "HR Admin") {
            baseItems.push({ name: "Employees", href: "/dashboard/employees", icon: Users });
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
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutDashboard className="text-white" size={24} />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white">HRMS<span className="text-indigo-500">.</span></span>
                    </div>

                </div>

                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold"
                                    : "hover:bg-slate-900 hover:text-white font-medium"
                                    }`}
                            >
                                <Icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400 transition-colors"} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User preview */}
                <div className="mt-auto p-4">
                    <div className="bg-gradient-to-b from-slate-900 to-black p-5 rounded-[2rem] border border-slate-800/50 shadow-xl relative overflow-hidden group">
                        {/* Background glow */}
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
                        
                        <div className="flex items-center gap-4 relative">
                            <div className="relative shrink-0">
                                {user.profile_picture ? (
                                    <img 
                                        src={getImageUrl(user.profile_picture)} 
                                        alt="Profile" 
                                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-800/50 bg-slate-800 shadow-sm" 
                                    />
                                ) : (
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-400 flex items-center justify-center font-black text-lg ring-1 ring-indigo-500/20">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[3px] border-slate-950 rounded-full shadow-sm transition-colors duration-500 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                                    'bg-slate-500'
                                }`}></div>
                            </div>
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-black text-white truncate tracking-tight">{user.name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-indigo-500/50"></span>
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
