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
    CheckCircle2,
    CalendarOff,
    IndianRupee,
    Briefcase,
    Megaphone,
    ChevronRight,
    UserCheck,
    Home,
    AlertCircle,
    PartyPopper,
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
            refreshDashboard();
        } catch (err) {
            alert(`Failed to ${action} request`);
        }
    };

    const mode = stats?.current_mode || (attendance_status === 'checked-in' ? 'office' : 'remote');

    return (
        <div className="space-y-4 md:space-y-8 page-transition pb-24 md:pb-10">
            {/* Compact Header Section */}
            <header className="relative py-4 md:py-8 overflow-hidden rounded-3xl md:rounded-[2rem] bg-slate-900 shadow-xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10 px-5 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{greeting.text}, {user?.name?.split(' ')[0] || 'User'}</span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight leading-none">
                            Your <span className="text-rose-400">Workspace</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {attendance_status === 'checked-in' ? (
                            <Link href="/dashboard/attendance" className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl backdrop-blur-md group hover:bg-emerald-500/20 transition-all">
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 relative"></div>
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-0.5">Online</p>
                                    <p className="text-xs font-bold text-white">Active Session</p>
                                </div>
                                <ArrowRight size={14} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link href="/dashboard/attendance" className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-500 px-5 py-3 rounded-2xl shadow-lg shadow-rose-900/20 transition-all active:scale-95 group">
                                <Clock size={16} className="text-white" />
                                <span className="text-xs font-black text-white uppercase tracking-wider">Start Shift</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
                
                {/* Primary Content: Stats & Approvals */}
                <div className="md:col-span-8 space-y-6 md:space-y-8">
                    
                    {/* Quick Shortcuts for Mobile (Shown only on mobile) */}
                    <section className="md:hidden">
                        <div className="grid grid-cols-4 gap-2">
                            <MobileQuickLink href="/dashboard/attendance" icon={HistoryIcon} label="Attendance" color="text-rose-600 bg-rose-50" />
                            <MobileQuickLink href="/dashboard/leaves" icon={Calendar} label="Leave" color="text-emerald-600 bg-emerald-50" />
                            <MobileQuickLink href="/dashboard/salary" icon={IndianRupee} label="Salary" color="text-violet-600 bg-violet-50" />
                            <MobileQuickLink href="/dashboard/employees" icon={Users} label="Team" color="text-cyan-600 bg-cyan-50" />
                        </div>
                    </section>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {isStatAdmin ? (
                            <>
                                <StatCard label="Employees" value={stats?.total_employees || 0} icon={Users} variant="rose" />
                                <StatCard label="Present" value={stats?.today_present || 0} icon={UserCheck} variant="emerald" />
                                <StatCard label="Remote" value={stats?.wfh_count || 0} icon={Home} variant="cyan" />
                                <StatCard 
                                    label="Requests" 
                                    value={(stats?.pending_leaves || 0) + (stats?.pending_expenses || 0)} 
                                    icon={AlertCircle} 
                                    variant="amber"
                                    highlight={((stats?.pending_leaves || 0) + (stats?.pending_expenses || 0)) > 0}
                                />
                            </>
                        ) : (
                            <>
                                <StatCard label="Leaves" value={stats?.personal_total || 0} icon={CalendarOff} variant="rose" />
                                <StatCard 
                                    label="Pending" 
                                    value={stats?.personal_pending || 0} 
                                    icon={Clock} 
                                    variant="amber"
                                    highlight={(stats?.personal_pending || 0) > 0}
                                />
                                <StatCard 
                                    label="Work Mode" 
                                    value={mode === 'office' ? 'Office' : 'Remote'} 
                                    icon={mode === 'office' ? Briefcase : Home} 
                                    variant="cyan"
                                />
                                <StatCard 
                                    label="Alerts" 
                                    value={stats?.recent_notifications?.filter((n: any) => !n.read)?.length || 0} 
                                    icon={Megaphone} 
                                    variant="violet"
                                    highlight={(stats?.recent_notifications?.filter((n: any) => !n.read)?.length || 0) > 0}
                                />
                            </>
                        )}
                    </div>

                    {/* Pending Actions for Admins / Managers */}
                    {(isHR || isFinance) && (stats?.pending_leaves_list?.length > 0 || stats?.pending_expenses_list?.length > 0) && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                                Approval Needed
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {stats?.pending_leaves_list?.map((leave: any) => (
                                    <ApprovalItem 
                                        key={leave.request_id} 
                                        data={leave} 
                                        type="leave" 
                                        onApprove={() => handleAction(leave.request_id, 'leave', 'approve')}
                                        onReject={() => handleAction(leave.request_id, 'leave', 'reject')}
                                    />
                                ))}
                                {stats?.pending_expenses_list?.map((expense: any) => (
                                    <ApprovalItem 
                                        key={expense.expense_id} 
                                        data={expense} 
                                        type="expense" 
                                        onApprove={() => handleAction(expense.expense_id, 'expense', 'approve')}
                                        onReject={() => handleAction(expense.expense_id, 'expense', 'reject')}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Announcements Section */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-5 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Megaphone size={14} className="text-rose-500" />
                                Announcements
                            </h2>
                            <Link href="/dashboard/announcements" className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors">
                                Newsroom
                            </Link>
                        </div>
                        <div className="p-4 md:p-5 divide-y divide-slate-50">
                            {stats?.latest_announcements?.length > 0 ? (
                                stats.latest_announcements.map((ann: any) => (
                                    <AnnouncementRow key={ann.id} announcement={ann} />
                                ))
                            ) : (
                                <div className="py-10 text-center space-y-2">
                                    <Megaphone size={24} className="mx-auto text-slate-200" />
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Nothing to report</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Secondary Content */}
                <div className="md:col-span-4 space-y-6 md:space-y-8">
                    
                    {/* Desktop Quick Shortcuts (Hidden on mobile) */}
                    <section className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-rose-100/50 transition-colors duration-700"></div>
                        <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-6 relative z-10 uppercase">Quick Shortcuts</h2>
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <QuickLink href="/dashboard/attendance" icon={HistoryIcon} label="Attendance" color="bg-rose-50 text-rose-600" />
                            <QuickLink href="/dashboard/leaves" icon={Calendar} label="Leave" color="bg-emerald-50 text-emerald-600" />
                            <QuickLink href="/dashboard/salary" icon={IndianRupee} label="Salary" color="bg-violet-50 text-violet-600" />
                            <QuickLink href="/dashboard/employees" icon={Users} label="Team" color="bg-cyan-50 text-cyan-600" />
                        </div>
                    </section>

                    <RequestTracking />

                    {/* Compact Timeline */}
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Timeline</h2>
                            <HistoryIcon size={14} className="text-slate-300" />
                        </div>
                        <div className="space-y-5 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-50">
                            {stats?.recent_notifications?.length > 0 ? (
                                stats.recent_notifications.slice(0, 4).map((notif: any) => (
                                    <div key={notif.id} className="relative pl-7 group">
                                        <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 bg-white z-10 flex items-center justify-center transition-all ${
                                            notif.title.toLowerCase().includes('approved') ? 'border-emerald-500' :
                                            notif.title.toLowerCase().includes('rejected') ? 'border-rose-500' : 'border-slate-200'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${
                                                notif.title.toLowerCase().includes('approved') ? 'bg-emerald-500' :
                                                notif.title.toLowerCase().includes('rejected') ? 'bg-rose-500' : 'bg-slate-300'
                                            }`}></div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{notif.title}</p>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 opacity-70 leading-tight">{notif.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No activity</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}

// --- Specialized UI Components ---

function StatCard({ label, value, icon: Icon, variant, highlight }: any) {
    const variants: any = {
        rose: "text-rose-600 bg-rose-50",
        emerald: "text-emerald-600 bg-emerald-50",
        cyan: "text-cyan-600 bg-cyan-50",
        amber: "text-amber-600 bg-amber-50",
        violet: "text-violet-600 bg-violet-50"
    };

    return (
        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${variants[variant] || variants.rose} transition-transform group-hover:scale-110`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                {highlight && (
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
            </div>
            
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight transition-colors truncate">{value}</h3>
            </div>
        </div>
    );
}

function MobileQuickLink({ href, icon: Icon, label, color }: any) {
    return (
        <Link href={href} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl active:scale-90 transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-white/50 ${color}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
        </Link>
    );
}

function ApprovalItem({ data, type, onApprove, onReject }: any) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${type === 'leave' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                    {type === 'leave' ? <CalendarOff size={20} /> : <IndianRupee size={20} />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-900 tracking-tight truncate">{data.employee_name}</p>
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-widest">{type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                        {type === 'leave' ? `${data.leave_type}: ${data.reason}` : `₹${data.amount} - ${data.category}`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 md:ml-4">
                <button onClick={onReject} className="flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all">Decline</button>
                <button onClick={onApprove} className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all shadow-md">Approve</button>
            </div>
        </div>
    );
}

function AnnouncementRow({ announcement }: any) {
    const title = announcement.title?.toLowerCase() || "";
    let Icon = Megaphone;
    let color = "text-slate-400 bg-slate-50";
    
    if (title.includes("birthday") || title.includes("celebration")) {
        Icon = PartyPopper;
        color = "text-rose-500 bg-rose-50";
    } else if (title.includes("holiday") || title.includes("calendar")) {
        Icon = Calendar;
        color = "text-emerald-500 bg-emerald-50";
    }

    return (
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3 group">
            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-105`}>
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-xs tracking-tight truncate uppercase leading-none mb-1">{announcement.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1 leading-tight">{announcement.message}</p>
            </div>
            <ChevronRight size={14} className="text-slate-200 group-hover:text-rose-400 transition-colors" />
        </div>
    );
}

function QuickLink({ href, icon: Icon, label, color }: any) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl transition-all duration-300 group">
            <div className={`p-3 rounded-2xl mb-2 transition-all group-hover:scale-110 ${color} border border-white/50 shadow-sm`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-black text-slate-500 group-hover:text-rose-600 uppercase tracking-widest transition-colors">{label}</span>
        </Link>
    );
}
