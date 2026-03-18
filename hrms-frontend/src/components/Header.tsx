"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, Check, User, Clock, Download, RefreshCw } from "lucide-react";
import { appsScriptFetch } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { usePWA } from "@/contexts/PWAContext";
import { toast } from "react-hot-toast";

export default function Header() {
    const { user, logout, attendanceStatus } = useAuth();
    const { isInstallable, installApp, updateApp, swUpdateAvailable } = usePWA();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const knownNotificationIds = React.useRef(new Set<string>());

    useEffect(() => {
        // Request native notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.employee_id) return;
            try {
                const data = await appsScriptFetch("/get-notifications", { 
                    employee_id: user.employee_id,
                    department: user.department,
                    role: user.role?.toLowerCase()
                });
                if (data) {
                    // Check for newly arriving notifications
                    if (knownNotificationIds.current.size > 0) {
                        data.forEach((n: any) => {
                            if (!knownNotificationIds.current.has(n.id) && !n.read) {
                                // Trigger native push notification
                                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                                    new Notification(n.title, { body: n.message, icon: '/logo.png' });
                                }
                                // Trigger in-app toast
                                toast.success(`${n.title}: ${n.message}`, { id: n.id, icon: '🔔' });
                            }
                        });
                    }
                    
                    // Update known IDs
                    data.forEach((n: any) => knownNotificationIds.current.add(n.id));
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = document.getElementById('notification-dropdown');
            if (dropdown && !dropdown.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        fetchNotifications();
        document.addEventListener('mousedown', handleClickOutside);
        const interval = setInterval(fetchNotifications, 5000); // Check every 5s

        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user?.employee_id]);

    const markAsRead = async (id: string) => {
        try {
            await appsScriptFetch("/mark-notification-read", { id });
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="sticky top-0 z-30 w-full glass-effect border-b border-slate-100 md:border-white/20 px-4 md:px-0 transition-colors duration-300">
            <div className="flex items-center justify-between h-[64px] md:h-[80px] max-w-7xl mx-auto md:px-8">
                {/* Mobile Left: Profile Pic */}
                <div className="md:hidden flex-1 flex items-center">
                    <Link href="/dashboard/settings" className="relative w-9 h-9 active:scale-95 transition-transform">
                        {user?.profile_picture ? (
                            <img 
                                src={getImageUrl(user.profile_picture)} 
                                alt="" 
                                className="absolute inset-0 w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-sm border border-slate-100 z-10 transition-opacity duration-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '0';
                                }}
                                onLoad={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '1';
                                }}
                            />
                        ) : null}
                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm ring-2 ring-white">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full shadow-sm transition-colors duration-500 ${
                            attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                            attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                            'bg-slate-500'
                        }`}></div>
                    </Link>
                </div>

                {/* Mobile Center: Title */}
                <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-100 ring-1 ring-slate-100">
                        <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="font-black text-xl text-slate-950 tracking-tighter uppercase">ASPIRE<span className="text-rose-600">.</span></span>
                </div>

                {/* Desktop spacer */}
                <div className="hidden md:block flex-1" />

                <div className="flex items-center justify-end gap-5 text-slate-600 md:flex-none">

                    {/* Mobile Update/Install Button */}
                    <div className="md:hidden">
                        {(isInstallable || swUpdateAvailable) && (
                            <button
                                onClick={isInstallable ? installApp : updateApp}
                                className={`p-3 rounded-2xl transition-all duration-300 active:scale-95 ${
                                    isInstallable 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"
                                    : "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse shadow-sm"
                                }`}
                            >
                                {isInstallable ? <Download size={22} /> : <RefreshCw size={22} className="animate-spin" />}
                            </button>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="relative" id="notification-dropdown">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative p-3 rounded-2xl transition-all duration-500 transform active:scale-95 ${showNotifications ? 'bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-xl shadow-rose-600/30 ring-4 ring-rose-50' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <Bell size={22} className={showNotifications ? "fill-white/20 animate-pulse" : "group-hover:rotate-12 transition-transform"} />
                            {unreadCount > 0 && (
                                <span className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full border-[3px] shadow-sm animate-bounce ${showNotifications ? 'bg-white border-rose-600' : 'bg-rose-500 border-white'}`}></span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                {/* Mobile Backdrop */}
                                <div
                                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-500"
                                    onClick={() => setShowNotifications(false)}
                                />

                                <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 w-auto md:w-[26rem] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden transform transition-all animate-in fade-in zoom-in slide-in-from-top-6 duration-500 origin-top md:origin-top-right z-50">
                                    <div className="p-7 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-slate-50/50 to-white/50">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-xl tracking-tight">Recent Activity</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Stay updated with your team</p>
                                        </div>
                                        <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg ring-1 ring-rose-100">
                                            {unreadCount} New
                                        </div>
                                    </div>
                                    <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-3 custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            <div className="space-y-2">
                                                {notifications.map(notification => (
                                                    <div key={notification.id} className={`p-5 rounded-[1.8rem] transition-all duration-300 relative overflow-hidden group/notif ${!notification.read ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}`}>
                                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                                            <p className="font-extrabold text-slate-900 leading-tight group-hover/notif:text-rose-600 transition-colors">{notification.title}</p>
                                                            {!notification.read && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]"></span>}
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed font-medium opacity-80 group-hover/notif:opacity-100 transition-opacity">{notification.message}</p>
                                                        <div className="flex items-center justify-between mt-4 relative z-10">
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/50 rounded-lg text-slate-400 font-bold text-[9px] md:text-[10px] ring-1 ring-slate-100">
                                                                <Clock size={12} />
                                                                {notification.time}
                                                            </div>
                                                            {!notification.read && (
                                                                <button onClick={() => markAsRead(notification.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-1.5 hover:text-rose-800 transition-all transform active:scale-95 group/btn">
                                                                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center group-hover/btn:bg-rose-600 group-hover/btn:text-white transition-colors">
                                                                        <Check size={12} className="stroke-[3]" />
                                                                    </div>
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 px-6 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 ring-1 ring-slate-100 shadow-inner">
                                                    <Bell size={40} strokeWidth={1.5} />
                                                </div>
                                                <h4 className="font-black text-slate-900 mb-1 tracking-tight">All caught up!</h4>
                                                <p className="text-sm font-medium text-slate-400">No new notifications at the moment.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                                        <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors text-center">View All Activity</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Desktop User details */}
                    <div className="hidden md:flex items-center gap-4 pl-5 border-l border-slate-200">
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900 tracking-tight">{user?.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user?.department}</p>
                        </div>
                        <div className="relative w-10 h-10">
                            {user?.profile_picture ? (
                                <img 
                                    src={getImageUrl(user.profile_picture)} 
                                    alt="" 
                                    className="absolute inset-0 w-10 h-10 rounded-2xl object-cover ring-4 ring-white shadow-sm border border-slate-100 z-10 transition-opacity duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.opacity = '0';
                                    }}
                                    onLoad={(e) => {
                                        (e.target as HTMLImageElement).style.opacity = '1';
                                    }}
                                />
                            ) : null}
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm ring-4 ring-white">
                                <User size={20} strokeWidth={2.5} />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[3px] border-white rounded-full shadow-sm transition-colors duration-500 ${
                                attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                                attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                                'bg-slate-500'
                            }`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
