"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import {
    Users,
    Clock,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    CalendarOff,
    Receipt,
    Briefcase,
    Megaphone,
    ChevronRight,
    UserCheck,
    Home,
    AlertCircle,
    RefreshCcw
} from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await appsScriptFetch("/dashboard-stats", { 
                    employee_id: user?.employee_id, 
                    role: user?.role 
                });
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        }
        
        loadStats();

        // Auto-refresh every 10 seconds for a "real-time" sync experience
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const refreshDashboard = async () => {
        setLoading(true);
        try {
            const data = await appsScriptFetch("/dashboard-stats", { 
                employee_id: user?.employee_id, 
                role: user?.role 
            });
            setStats(data);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
        </div>;
    }

    const isAdmin = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Finance" || user?.role === "Manager";
    const isHR = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager";
    const isFinance = user?.role === "Super Admin" || user?.role === "Finance" || user?.role === "Manager";

    const handleAction = async (id: string, type: 'leave' | 'expense', action: 'approve' | 'reject') => {
        try {
            await appsScriptFetch(`/${action}-request`, {
                request_id: id,
                type,
                role: user?.role,
                approver_id: user?.employee_id
            });
            window.location.reload();
        } catch (err) {
            alert(`Failed to ${action} request`);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 page-transition pb-10">
            <div className="px-1 md:px-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user?.name.split(' ')[0]}!</h1>
                <p className="text-sm md:text-base text-slate-500 font-medium">Here is what is happening today.</p>
            </div>

            {isAdmin ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="Total Employees" value={stats?.total_employees || 0} icon={Users} color="text-indigo-600" bg="from-indigo-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                    <StatCard title="Present Today" value={stats?.today_present || 0} icon={UserCheck} color="text-emerald-600" bg="from-emerald-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                    <StatCard title="Working From Home" value={stats?.wfh_count || 0} icon={Home} color="text-cyan-600" bg="from-cyan-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                    <StatCard title="Pending Approvals" value={(stats?.pending_leaves || 0) + (stats?.pending_expenses || 0)} icon={AlertCircle} color="text-rose-600" bg="from-rose-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 premium-card">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="p-5 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Status</p>
                                <p className="text-lg md:text-xl font-black text-slate-900 mt-1">Not Checked In</p>
                            </div>
                            <div className="p-2.5 md:p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                <Clock className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={28} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
                <div className="xl:col-span-2 space-y-8">
                    {/* Announcements Section */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                        <div className="p-5 md:p-7 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm ring-1 ring-indigo-100">
                                    <Megaphone size={20} />
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-800">Announcements</h2>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-600 ring-1 ring-emerald-100">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Live Sync
                                </div>
                            </div>
                            <button className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors group">
                                View All <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="p-5 md:p-7">
                            <div className="space-y-4 md:space-y-6">
                                {stats?.latest_announcements?.length > 0 ? (
                                    stats.latest_announcements.map((announcement: any) => (
                                        <div key={announcement.id} className="p-4 md:p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex gap-4 md:gap-5 hover:bg-slate-50/70 transition-colors cursor-pointer group clickable">
                                            <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                                {announcement.type?.charAt(0) || 'A'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">{announcement.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ${
                                                            announcement.priority === 'urgent' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                            announcement.priority === 'high' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                                                            'bg-slate-50 text-slate-500 ring-slate-100'
                                                        }`}>
                                                            {announcement.priority || 'normal'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 mt-1 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">{announcement.message}</p>
                                                <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4">
                                                    <p className="text-[10px] md:text-xs font-semibold text-slate-400">
                                                        {new Date(announcement.timestamp).toLocaleDateString()}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <p className="text-[10px] md:text-xs font-bold text-indigo-500">Read Details</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <Megaphone size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">No announcements yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isHR && stats?.pending_leaves_list?.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden premium-card">
                            <div className="p-7 border-b border-slate-100 bg-gradient-to-r from-orange-50/30 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shadow-sm ring-1 ring-orange-100">
                                        <CalendarOff size={22} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Pending Leave Requests</h2>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {stats.pending_leaves_list.map((leave: any) => (
                                    <div key={leave.request_id} className="p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold shadow-sm ring-1 ring-slate-100">
                                                {leave.employee_id?.toString().split('-').pop()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-lg">{leave.leave_type} Leave</p>
                                                <p className="text-sm font-semibold text-slate-500">Dates: {new Date(leave.start_date).toLocaleDateString()} &mdash; {new Date(leave.end_date).toLocaleDateString()}</p>
                                                <p className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm italic">&ldquo;{leave.reason}&rdquo;</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-3 shrink-0">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                                {leave.status.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleAction(leave.request_id, 'leave', 'reject')} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">Reject</button>
                                                <button onClick={() => handleAction(leave.request_id, 'leave', 'approve')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">Approve</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isFinance && stats?.pending_expenses_list?.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden premium-card">
                            <div className="p-7 border-b border-slate-100 bg-gradient-to-r from-emerald-50/30 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm ring-1 ring-emerald-100">
                                        <Receipt size={22} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Pending Reimbursements</h2>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {stats.pending_expenses_list.map((expense: any) => (
                                    <div key={expense.expense_id} className="p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex-1 flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold shadow-sm ring-1 ring-slate-100">
                                                ₹
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-2xl font-black text-slate-900">₹{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">{expense.category}</span>
                                                </div>
                                                <p className="text-slate-600 mt-2 text-sm leading-relaxed">{expense.description}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">Request ID: {expense.expense_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-3 shrink-0">
                                            {expense.receipt_file && (
                                                <a href={expense.receipt_file} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 group p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    View Receipt <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </a>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleAction(expense.expense_id, 'expense', 'reject')} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">Reject</button>
                                                <button onClick={() => handleAction(expense.expense_id, 'expense', 'approve')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">Approve</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 premium-card">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6 md:mb-8 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            Recent Activity
                        </h2>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 md:space-y-10 pb-4">
                            {stats?.recent_notifications?.length > 0 ? (
                                stats.recent_notifications.map((notif: any) => (
                                    <div key={notif.id} className="relative">
                                        <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 shadow-sm ring-4 ring-white ${notif.read ? 'border-slate-200' : 'border-indigo-600'}`}></span>
                                        <div className="ml-6 md:ml-8">
                                            <p className="font-bold text-slate-900 text-base md:text-lg tracking-tight">{notif.title}</p>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">{notif.message}</p>
                                            <p className="text-[10px] font-black text-slate-400 mt-2.5 md:mt-3 uppercase tracking-wider">
                                                {new Date(notif.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="ml-8">
                                    <p className="text-slate-400 font-medium italic">No recent activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, iconBg }: any) {
    return (
        <div className={`rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-8 flex flex-col gap-4 md:gap-6 bg-gradient-to-br ${bg} premium-card group overflow-hidden relative`}>
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className={`p-3 md:p-4 rounded-2xl w-fit ${iconBg} ${color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon size={24} className="md:size-[28px]" />
            </div>
            <div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 md:mb-1.5 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
                    <span className="text-[9px] md:text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded-full">+12%</span>
                </div>
            </div>
        </div>
    );
}
