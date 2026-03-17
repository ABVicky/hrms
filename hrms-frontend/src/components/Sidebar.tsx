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
        const role = user.role?.toLowerCase();
        const HR_LEVEL_ROLES = ["super admin", "hr admin", "manager", "ceo", "admin"];
        const ANALYTICS_ROLES = ["super admin", "hr admin", "admin"];
        
        const isHR = role && HR_LEVEL_ROLES.includes(role);
        const canSeeAllAnalytics = role && ANALYTICS_ROLES.includes(role);

        const items: any[] = [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ];

        // Attendance menu item - Hidden for Super Admin
        if (role !== "super admin") {
            items.push({ name: "Attendance", href: "/dashboard/attendance", icon: MapPin });
        }

        // Analytics menu item - For Admin, HR Admin, Super Admin
        if (canSeeAllAnalytics) {
            items.push({ name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 });
        }

        // Announcements - For HR Admin and above
        if (isHR || role === "hr admin") {
            items.push({ name: "Announcements", href: "/dashboard/announcements", icon: Megaphone });
        }

        items.push(
            { name: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
            { name: "Expenses", href: "/dashboard/expenses", icon: IndianRupee }
        );

        if (isHR) {
            items.push({ name: "Employees", href: "/dashboard/employees", icon: Users });
        }

        // Salary module visibility
        const isFinanceDept = user.department?.toLowerCase() === "finance";
        if (role === "super admin" || isFinanceDept || role === "employee" || role === "manager") {
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
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
                <div className="flex items-center justify-between px-6 h-24 border-b border-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <img 
                                src="/logo.png" 
                                alt="ASPIRE Logo" 
                                className="w-7 h-7 object-contain"
                            />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white uppercase">ASPIRE<span className="text-rose-500">.</span></span>
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
                                    ? "bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-[0_10px_30px_rgba(225,29,72,0.3)] font-extrabold translate-x-2"
                                    : "hover:bg-slate-900/50 hover:text-white font-bold text-slate-400 hover:translate-x-1"
                                    }`}
                            >
                                {isActive && <div className="absolute left-0 top-0 w-1.5 h-full bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>}
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-slate-600 group-hover:text-rose-400 transition-colors"} />
                                <span className="tracking-tight">{item.name}</span>
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

                    <div className="bg-gradient-to-br from-slate-900 to-black p-4 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-rose-500/30">
                        {/* Soft Glow */}
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="relative shrink-0">
                                {user.profile_picture ? (
                                    <img 
                                        src={getImageUrl(user.profile_picture)} 
                                        alt="" 
                                        className="absolute inset-0 w-11 h-11 rounded-xl object-cover ring-2 ring-slate-800 shadow-xl z-10 transition-all duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0';
                                        }}
                                        onLoad={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '1';
                                        }}
                                    />
                                ) : null}
                                <div className="w-11 h-11 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center ring-1 ring-slate-700">
                                    <User size={20} strokeWidth={2.5} />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-[3px] border-slate-950 rounded-full shadow-lg z-20 transition-all duration-700 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500 shadow-rose-500/20' : 
                                    'bg-slate-600'
                                }`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white tracking-tight leading-tight group-hover:text-rose-300 transition-colors">{user.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                        {user.role}
                                    </span>
                                </div>
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
