"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Megaphone,
    MapPin,
    CalendarOff,
    IndianRupee,
    Users,
    Settings,
    User,
    RefreshCw,
    Download,
    Wallet,
    BarChart2
} from "lucide-react";
import { isEmployee, isHRAdmin, isFinanceAdmin, isSuperAdmin } from "@/lib/roles";
import { useAuth } from "@/contexts/AuthContext";
import { usePWA } from "@/contexts/PWAContext";
import { getImageUrl } from "@/lib/utils";
import { APP_VERSION } from "@/constants/version";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const pathname = usePathname();
    const { user, attendanceStatus } = useAuth();
    const { isInstallable, installApp, updateApp, swUpdateAvailable } = usePWA();

    if (!user) return null;

    const getNavItems = () => {
        const items: any[] = [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ];

        // Attendance menu item - Hidden for Super Admin
        if (!isSuperAdmin(user)) {
            items.push({ name: "Attendance", href: "/dashboard/attendance", icon: MapPin });
        }

        // Analytics menu item - For Admin, HR Admin, Super Admin (All non-Employees maybe?)
        // Requirement: SUPER_ADMIN monitors all activities. HR_ADMIN approves leaves.
        if (isSuperAdmin(user) || isHRAdmin(user)) {
            items.push({ name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 });
        }

        // Announcements - For HR Admin and Super Admin
        if (isHRAdmin(user) || isSuperAdmin(user)) {
            items.push({ name: "Announcements", href: "/dashboard/announcements", icon: Megaphone });
        }

        items.push(
            { name: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
            { name: "Expenses", href: "/dashboard/expenses", icon: IndianRupee }
        );

        // Employee Management - For HR Admin and Super Admin
        if (isHRAdmin(user) || isSuperAdmin(user)) {
            items.push({ name: "Employees", href: "/dashboard/employees", icon: Users });
        }

        // Salary module visibility - Everyone except Super Admin (per requirements)
        if (!isSuperAdmin(user)) {
            items.push({ name: "Salary", href: "/dashboard/salary", icon: Wallet });
        }

        items.push({ name: "Settings", href: "/dashboard/settings", icon: Settings });
        return items;
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
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xl`}>
                <div className="flex items-center justify-between px-6 h-20 border-b border-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <img 
                                src="/logo.png" 
                                alt="ASPIRE Logo" 
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white uppercase">ASPIRE<span className="text-rose-500">.</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 font-semibold"
                                    : "hover:bg-white/5 hover:text-white font-medium text-slate-400"
                                    }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-slate-500 group-hover:text-rose-400 transition-colors"} />
                                <span className="tracking-tight text-[15px]">{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-l-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User preview */}
                <div className="mt-auto p-4 space-y-3 pb-[calc(env(safe-area-inset-bottom)+20px)]">
                    {/* PWA Action Button */}
                    <button
                        onClick={isInstallable ? installApp : updateApp}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group clickable ${
                            swUpdateAvailable || isInstallable
                            ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                            : "bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                    >
                        {isInstallable ? (
                            <Download size={18} className="group-hover:bounce" />
                        ) : (
                            <RefreshCw size={18} className={`${swUpdateAvailable ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        )}
                        <span>{isInstallable ? "Install App" : swUpdateAvailable ? "Update to Latest" : "Check for Updates"}</span>
                    </button>

                    <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group transition-all duration-300 hover:border-rose-500/20">
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="relative shrink-0">
                                {user.profile_picture ? (
                                    <img 
                                        src={getImageUrl(user.profile_picture)} 
                                        alt="" 
                                        className="absolute inset-0 w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 shadow-lg z-10 transition-all duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0';
                                        }}
                                        onLoad={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '1';
                                        }}
                                    />
                                ) : null}
                                <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center ring-1 ring-white/5">
                                    <User size={18} />
                                </div>
                                <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 border-2 border-slate-950 rounded-full z-20 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                                    'bg-slate-600'
                                }`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                    </div>
                    {/* Version Indicator */}
                    <div className="text-center px-4">
                        <span className="text-[10px] text-slate-700 font-medium uppercase tracking-widest">Version {APP_VERSION}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
