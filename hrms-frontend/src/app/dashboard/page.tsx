"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RequestTracking from "@/components/RequestTracking";
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
    RefreshCcw,
    PartyPopper,
    Award,
    Info,
    AlertTriangle,
    Heart,
    History as HistoryIcon
} from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // PERF: Load from local storage immediately (SWR)
        const cachedStats = localStorage.getItem(`hrms_stats_${user?.employee_id}`);
        if (cachedStats) {
            setStats(JSON.parse(cachedStats));
            setLoading(false);
        }

        async function loadStats(isBackground = false) {
            if (!isBackground && !cachedStats) setLoading(true);
            try {
                const data = await appsScriptFetch("/dashboard-stats", { 
                    employee_id: user?.employee_id, 
                    role: user?.role 
                });
                setStats(data);
                localStorage.setItem(`hrms_stats_${user?.employee_id}`, JSON.stringify(data));
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        }
        
        loadStats();

        // Auto-refresh for a "real-time" sync experience
        const interval = setInterval(() => loadStats(true), 15000);
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

    const isStatAdmin = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager";
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isStatAdmin && (
                    <>
                        <StatCard title="Total Employees" value={stats?.total_employees || 0} icon={Users} color="text-indigo-600" bg="from-indigo-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                        <StatCard title="Present Today" value={stats?.today_present || 0} icon={UserCheck} color="text-emerald-600" bg="from-emerald-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                        <StatCard title="Working From Home" value={stats?.wfh_count || 0} icon={Home} color="text-cyan-600" bg="from-cyan-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
                    </>
                )}
                
                <StatCard 
                    title="Pending Approvals" 
                    value={isStatAdmin || user?.role === 'Finance' ? ((stats?.pending_leaves || 0) + (stats?.pending_expenses || 0)) : (stats?.personal_pending || 0)} 
                    icon={AlertCircle} 
                    color="text-rose-600" 
                    bg="from-rose-50/50 to-white" 
                    iconBg="bg-white shadow-sm ring-1 ring-slate-100" 
                />

                {!isStatAdmin && (
                    <StatCard 
                        title="Requested Approvals" 
                        value={stats?.personal_total || 0} 
                        icon={RefreshCcw} 
                        color="text-amber-600" 
                        bg="from-amber-50/50 to-white" 
                        iconBg="bg-white shadow-sm ring-1 ring-slate-100" 
                    />
                )}
            </div>

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
                                    stats.latest_announcements.map((announcement: any) => {
                                        const title = announcement.title?.toLowerCase() || "";
                                        const message = announcement.message?.toLowerCase() || "";
                                        
                                        // Dynamic Icon Logic
                                        let Icon = Megaphone;
                                        let gradient = "from-indigo-600 to-violet-600";
                                        let shadow = "shadow-indigo-200";

                                        if (title.includes("birthday") || message.includes("birthday") || title.includes("celebration")) {
                                            Icon = PartyPopper;
                                            gradient = "from-rose-500 to-pink-500";
                                            shadow = "shadow-rose-100";
                                        } else if (title.includes("award") || title.includes("winner") || title.includes("congratulations")) {
                                            Icon = Award;
                                            gradient = "from-amber-400 to-orange-500";
                                            shadow = "shadow-amber-100";
                                        } else if (title.includes("holiday") || title.includes("leave") || title.includes("event")) {
                                            Icon = Calendar;
                                            gradient = "from-emerald-500 to-teal-600";
                                            shadow = "shadow-emerald-100";
                                        } else if (announcement.priority === 'urgent') {
                                            Icon = AlertTriangle;
                                            gradient = "from-rose-600 to-red-700";
                                            shadow = "shadow-rose-200";
                                        } else if (title.includes("policy") || title.includes("update")) {
                                            Icon = Info;
                                            gradient = "from-blue-500 to-indigo-600";
                                            shadow = "shadow-blue-100";
                                        }

                                        return (
                                            <div key={announcement.id} className="p-4 md:p-6 rounded-[2rem] border border-slate-100 bg-white/50 hover:bg-white transition-all duration-500 cursor-pointer group clickable shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
                                                <div className="flex gap-5 md:gap-6">
                                                    <div className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg ${shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                                        <Icon size={28} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <h3 className="font-extrabold text-slate-900 text-base md:text-xl tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{announcement.title}</h3>
                                                                <span className={`px-2.5 py-1 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ${
                                                                    announcement.priority === 'urgent' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                                    announcement.priority === 'high' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                                                                    'bg-slate-50 text-slate-500 ring-slate-100'
                                                                }`}>
                                                                    {announcement.priority || 'normal'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 mt-2 text-sm md:text-base leading-relaxed font-medium line-clamp-2 md:line-clamp-none opacity-80 group-hover:opacity-100 transition-opacity">{announcement.message}</p>
                                                        <div className="flex items-center justify-between mt-5 md:mt-6">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-slate-400 font-bold text-[10px] md:text-xs">
                                                                    <Clock size={12} />
                                                                    {new Date(announcement.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                <p className="text-[10px] md:text-xs font-black text-indigo-500 uppercase tracking-widest">{announcement.type || 'Announcement'}</p>
                                                            </div>
                                                            <button className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95">
                                                                Read Full <ChevronRight size={14} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
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
                    <RequestTracking />
                    
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 premium-card">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6 md:mb-8 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            Recent Activity
                        </h2>
                        <div className="relative border-l-[3px] border-slate-100 ml-5 space-y-10 md:space-y-12 pb-6">
                            {stats?.recent_notifications?.length > 0 ? (
                                stats.recent_notifications.map((notif: any) => (
                                    <div key={notif.id} className="relative group/item">
                                        <div className={`absolute -left-[13px] top-1.5 w-6 h-6 rounded-full bg-white border-2 shadow-sm transition-all duration-300 group-hover/item:scale-125 ${
                                            notif.read ? 'border-slate-300' : 
                                            notif.title.toLowerCase().includes('approved') ? 'border-emerald-500 shadow-emerald-200' :
                                            notif.title.toLowerCase().includes('rejected') ? 'border-rose-500 shadow-rose-200' :
                                            'border-indigo-600 shadow-indigo-200'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 auto-pulse ${
                                                notif.read ? 'bg-slate-300' : 
                                                notif.title.toLowerCase().includes('approved') ? 'bg-emerald-500' :
                                                notif.title.toLowerCase().includes('rejected') ? 'bg-rose-500' :
                                                'bg-indigo-600'
                                            }`}></div>
                                        </div>
                                        <div className="ml-8 md:ml-10 group-hover/item:translate-x-1 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-extrabold text-slate-900 text-base md:text-xl tracking-tight leading-tight group-hover/item:text-indigo-600 transition-colors">{notif.title}</p>
                                                {!notif.read && (
                                                    <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                                                )}
                                            </div>
                                            <p className="text-sm md:text-base text-slate-500 font-medium opacity-80 group-hover/item:opacity-100 transition-opacity">{notif.message}</p>
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 font-bold text-[10px] md:text-xs">
                                                    <Clock size={12} />
                                                    {new Date(notif.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="ml-10">
                                    <div className="p-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                        <HistoryIcon size={40} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No recent activity found</p>
                                    </div>
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
    const isStatPositive = true; // Demonstration

    return (
        <div className={`rounded-[2.5rem] shadow-sm border border-slate-100 p-5 md:p-8 flex flex-col gap-5 md:gap-7 bg-gradient-to-br ${bg} premium-card group overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5`}>
            {/* Glossy Overlay/Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-1000 delay-100"></div>

            <div className="flex items-center justify-between relative z-10">
                <div className={`p-4 md:p-5 rounded-[1.5rem] ${iconBg} ${color} shadow-lg ring-1 ring-white/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-white to-slate-50`}>
                    <Icon size={24} className="md:size-7" strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest ${isStatPositive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'}`}>
                    {isStatPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    12%
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-[10px] md:text-xs font-black text-slate-400 mb-1.5 md:mb-2 uppercase tracking-[0.2em]">{title}</p>
                <p className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors duration-500">{value}</p>
            </div>
            
            {/* Visual Progress Bar (Subtle) */}
            <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden mt-1 relative z-10">
                <div className={`h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[70%] group-hover:w-[75%] transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]`}></div>
            </div>
        </div>
    );
}
