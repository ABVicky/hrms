"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    IndianRupee,
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
    History as HistoryIcon,
    Sun,
    Moon,
    ArrowRight
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

        // Auto-refresh every 5 seconds for a "real-time" sync experience
        const interval = setInterval(loadStats, 5000);
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

    if (loading || !stats) {
        return <div className="space-y-6 animate-pulse p-4">
            <div className="h-40 bg-slate-200 rounded-[2rem] w-full"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-slate-200 rounded-[1.5rem]"></div>
                <div className="h-32 bg-slate-200 rounded-[1.5rem]"></div>
            </div>
            <div className="h-64 bg-slate-200 rounded-[2rem] w-full"></div>
        </div>;
    }

    const { attendance_status } = stats;

    const isStatAdmin = user?.role && ['super admin', 'hr admin', 'manager', 'ceo', 'admin'].includes(user.role.toLowerCase());
    const isHR = isStatAdmin;
    const isFinance = user?.role && ['super admin', 'finance', 'manager', 'ceo', 'admin'].includes(user.role.toLowerCase());

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-amber-500" };
        if (hour < 17) return { text: "Good Afternoon", icon: Sun, color: "text-orange-500" };
        return { text: "Good Evening", icon: Moon, color: "text-rose-500" };
    };

    const greeting = getTimeGreeting();
    const GreetingIcon = greeting.icon;

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
        <div className="space-y-6 md:space-y-8 page-transition pb-32 md:pb-10">
            {/* Unified Greeting Section */}
            <div className="flex items-center justify-between px-1 md:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <GreetingIcon size={16} className={greeting.color} />
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{greeting.text}</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                        Welcome back, {user?.name.split(' ')[0]}
                    </h1>
                </div>
                <div className="md:hidden">
                    <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">
                        ID: {user?.employee_id}
                    </div>
                </div>
            </div>

            {/* Mobile Hero Card: Attendance Quick-glance */}
            <div className="md:hidden">
                <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-500 ${
                    attendance_status === 'checked-in' 
                    ? 'bg-emerald-600 shadow-emerald-100' 
                    : 'bg-rose-600 shadow-rose-100'
                }`}>
                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">Attendance Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${attendance_status === 'checked-in' ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}`}></div>
                                    <h2 className="text-white text-2xl font-bold tracking-tight">
                                        {attendance_status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                                    </h2>
                                </div>
                            </div>
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                                <Clock className="text-white" size={24} />
                             </div>
                        </div>

                        <Link href="/dashboard/attendance" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm active:scale-[0.98] transition-all shadow-sm">
                            {attendance_status === 'checked-in' ? 'Manage Session' : 'Quick Check-in'}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isStatAdmin && (
                    <>
                        <StatCard title="Total Employees" value={stats?.total_employees || 0} icon={Users} color="text-rose-600" bg="from-rose-50/50 to-white" iconBg="bg-white shadow-sm ring-1 ring-slate-100" />
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
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden premium-card">
                        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <Megaphone size={18} />
                                </div>
                                <h2 className="text-base md:text-lg font-semibold text-slate-800">Announcements</h2>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Real-time
                                </div>
                            </div>
                            {(user?.role === "Super Admin" || user?.role === "HR Admin") && (
                                <Link href="/dashboard/announcements" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 group/link">
                                    View All
                                    <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                        </div>
                        <div className="p-5 md:p-6">
                            <div className="space-y-4">
                                {stats?.latest_announcements?.length > 0 ? (
                                    stats.latest_announcements.map((announcement: any) => {
                                        const title = announcement.title?.toLowerCase() || "";
                                        const message = announcement.message?.toLowerCase() || "";
                                        
                                        // Dynamic Icon Logic
                                        let Icon = Megaphone;
                                        let theme = "bg-slate-50 text-slate-600";
                                        
                                        if (title.includes("birthday") || message.includes("birthday") || title.includes("celebration")) {
                                            Icon = PartyPopper;
                                            theme = "bg-pink-50 text-pink-600";
                                        } else if (title.includes("award") || title.includes("winner") || title.includes("congratulations")) {
                                            Icon = Award;
                                            theme = "bg-amber-50 text-amber-600";
                                        } else if (title.includes("holiday") || title.includes("leave") || title.includes("event")) {
                                            Icon = Calendar;
                                            theme = "bg-emerald-50 text-emerald-600";
                                        } else if (announcement.priority === 'urgent') {
                                            Icon = AlertTriangle;
                                            theme = "bg-rose-50 text-rose-600";
                                        }

                                        return (
                                            <div key={announcement.id} className="p-5 rounded-xl border border-slate-100 bg-white hover:border-rose-200 transition-all duration-300 group cursor-pointer shadow-sm">
                                                <div className="flex gap-4">
                                                    <div className={`shrink-0 w-12 h-12 rounded-xl ${theme} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-bold text-slate-900 text-sm md:text-base tracking-tight leading-tight">{announcement.title}</h3>
                                                            </div>
                                                            <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                                                announcement.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                announcement.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-slate-50 text-slate-500 border-slate-100'
                                                            }`}>
                                                                {announcement.priority || 'normal'}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 mt-1 text-xs md:text-sm leading-relaxed line-clamp-2">{announcement.message}</p>
                                                        <div className="flex items-center justify-between mt-4 pb-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                                                                    <Clock size={12} />
                                                                    {new Date(announcement.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{announcement.type || 'Announcement'}</p>
                                                            </div>
                                                            <button className="text-rose-600 text-[10px] font-bold uppercase tracking-wider hover:underline">
                                                                Read More
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
                                                <button onClick={() => handleAction(leave.request_id, 'leave', 'approve')} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95">Approve</button>
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
                                        <IndianRupee size={22} />
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
                                                <a href={expense.receipt_file} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 group p-2 rounded-lg hover:bg-rose-50 transition-colors">
                                                    View Receipt <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </a>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleAction(expense.expense_id, 'expense', 'reject')} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">Reject</button>
                                                <button onClick={() => handleAction(expense.expense_id, 'expense', 'approve')} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95">Approve</button>
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
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
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
                                            'border-rose-600 shadow-rose-200'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 auto-pulse ${
                                                notif.read ? 'bg-slate-300' : 
                                                notif.title.toLowerCase().includes('approved') ? 'bg-emerald-500' :
                                                notif.title.toLowerCase().includes('rejected') ? 'bg-rose-500' :
                                                'bg-rose-600'
                                            }`}></div>
                                        </div>
                                        <div className="ml-8 md:ml-10 group-hover/item:translate-x-1 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-extrabold text-slate-900 text-base md:text-xl tracking-tight leading-tight group-hover/item:text-rose-600 transition-colors">{notif.title}</p>
                                                {!notif.read && (
                                                    <span className="flex h-2 w-2 rounded-full bg-rose-600"></span>
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

    return (
        <div className={`rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 flex flex-col gap-4 bg-white premium-card group relative transition-all duration-300`}>
            <div className="flex items-center justify-between relative z-10">
                <div className={`p-2.5 rounded-lg ${iconBg} ${color} border border-slate-50 shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{title}</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">{value}</p>
            </div>
            
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1 relative z-10">
                <div className={`h-full bg-rose-500/20 rounded-full w-[60%] group-hover:w-[65%] transition-all duration-500`}></div>
            </div>
        </div>
    );
}
