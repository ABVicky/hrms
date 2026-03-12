"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, Check } from "lucide-react";
import { appsScriptFetch } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export default function Header() {
    const { user, logout, attendanceStatus } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.employee_id) return;
            try {
                const data = await appsScriptFetch("/get-notifications", { employee_id: user.employee_id });
                if (data) setNotifications(data);
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
        const interval = setInterval(fetchNotifications, 30000); // Check every 30s

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
        <header className="sticky top-0 z-30 w-full glass-effect border-b border-white/20 px-4 md:px-0">
            <div className="flex items-center justify-between h-[64px] md:h-[80px] max-w-7xl mx-auto md:px-8">
                {/* Mobile Left: Profile Pic */}
                <div className="md:hidden flex-1 flex items-center">
                    <div className="relative">
                        {user?.profile_picture ? (
                            <img 
                                src={getImageUrl(user.profile_picture)} 
                                alt="" 
                                className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-sm border border-slate-100"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : null}
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-lg shadow-indigo-200 ring-2 ring-white absolute inset-0 -z-10">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full shadow-sm transition-colors duration-500 ${
                            attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                            attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                            'bg-slate-500'
                        }`}></div>
                    </div>
                </div>

                {/* Mobile Center: Title */}
                <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 font-black text-xl text-slate-950 tracking-tighter flex items-center gap-2">
                    HRMS<span className="text-indigo-600">.</span>
                </div>

                {/* Desktop spacer */}
                <div className="hidden md:block flex-1" />

                <div className="flex items-center justify-end gap-5 text-slate-600 md:flex-none">
                    {/* Notifications */}
                    <div className="relative" id="notification-dropdown">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative p-3 rounded-2xl transition-all duration-300 ${showNotifications ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <Bell size={22} className={showNotifications ? "fill-white/20" : ""} />
                            {unreadCount > 0 && (
                                <span className={`absolute top-2.5 right-2.5 w-3 h-3 rounded-full border-2 ${showNotifications ? 'bg-white border-indigo-600' : 'bg-red-500 border-white'}`}></span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                {/* Mobile Backdrop */}
                                <div
                                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                                    onClick={() => setShowNotifications(false)}
                                />

                                <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 w-auto md:w-96 bg-white rounded-[2rem] md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 origin-top md:origin-top-right z-50">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-slate-50 to-white">
                                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Activity</h3>
                                    </div>
                                    <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-2">
                                        {notifications.length > 0 ? (
                                            <div className="space-y-1">
                                                {notifications.map(notification => (
                                                    <div key={notification.id} className={`p-4 rounded-2xl transition-all ${!notification.read ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <p className="font-bold text-slate-900">{notification.title}</p>
                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-3">{notification.time}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{notification.message}</p>
                                                        {!notification.read && (
                                                            <button onClick={() => markAsRead(notification.id)} className="mt-3 text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5 hover:text-indigo-800 group">
                                                                <Check size={14} className="stroke-[3]" /> Mark as read
                                                            </button>
                                                        )}
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
                        <div className="relative">
                            {user?.profile_picture ? (
                                <img 
                                    src={getImageUrl(user.profile_picture)} 
                                    alt="" 
                                    className="w-10 h-10 rounded-2xl object-cover ring-4 ring-white shadow-sm border border-slate-100"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : null}
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-200 ring-4 ring-white absolute inset-0 -z-10">
                                {user?.name?.charAt(0) || 'U'}
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
