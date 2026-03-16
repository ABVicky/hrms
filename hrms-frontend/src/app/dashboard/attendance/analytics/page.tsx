"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line
} from "recharts";
import {
    Clock, AlertTriangle, Home, Calendar, Loader2, ArrowLeft, BarChart2,
    CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────

interface DayData {
    date: string;
    working_hours: number;
    mode: 'office' | 'wfh';
    check_in: string;
    check_out: string;
    is_late: boolean;
    late_by_minutes: number;
    attendance_status: string;
}

interface Stats {
    total_present: number;
    total_late: number;
    avg_hours: number;
    total_hours: number;
    wfh_days: number;
    office_days: number;
}

interface EmployeeAnalytics {
    employee_id: string;
    name: string;
    department: string;
    role: string;
    profile_picture?: string;
    seven_day_data: DayData[];
    thirty_day_data: DayData[];
    stats_30: Stats;
    stats_7: Stats;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
    if (!iso || iso === "---") return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { weekday: 'short' });
};

// Build last-7-days skeleton (fill missing dates as absent)
function buildWeekGrid(data: DayData[]): (DayData & { absent?: boolean })[] {
    const map: Record<string, DayData> = {};
    data.forEach(d => { map[d.date] = d; });

    const result: (DayData & { absent?: boolean })[] = [];
    for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        if (map[key]) {
            result.push({ ...map[key], absent: false });
        } else {
            result.push({
                date: key, working_hours: 0, mode: 'office',
                check_in: '', check_out: '', is_late: false, late_by_minutes: 0,
                attendance_status: 'absent', absent: true
            });
        }
    }
    return result;
}

// Build 30-day chart data
function buildChartData(data: DayData[]) {
    return data.map(d => ({
        date: fmtDate(d.date),
        day: fmtDay(d.date),
        hours: d.working_hours,
        late: d.is_late ? d.late_by_minutes : 0,
        is_late: d.is_late,
        absent: false
    }));
}

// ─── Custom Tooltips ─────────────────────────────────────────────────────────

const HoursTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-xs">
            <p className="font-black text-slate-900 mb-1">{payload[0]?.payload?.day}, {label}</p>
            <p className="text-rose-600 font-bold">{payload[0]?.value?.toFixed(1)} hrs worked</p>
        </div>
    );
};

const LateTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-xs">
            <p className="font-black text-slate-900 mb-1">{payload[0]?.payload?.day}, {label}</p>
            {payload[0]?.value > 0
                ? <p className="text-amber-600 font-bold">Late by {payload[0]?.value} min</p>
                : <p className="text-emerald-600 font-bold">On time ✓</p>}
        </div>
    );
};

// ─── Self Analytics Section ───────────────────────────────────────────────────

function SelfAnalytics({ emp }: { emp: EmployeeAnalytics }) {
    const chartData = buildChartData(emp.thirty_day_data);
    const s = emp.stats_30;
    const week = buildWeekGrid(emp.seven_day_data);

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Days Present', value: s.total_present, sub: 'last 30 days', color: 'rose', icon: CheckCircle2 },
                    { label: 'Avg Hours/Day', value: `${s.avg_hours}h`, sub: 'standard 9h', color: 'violet', icon: Clock },
                    { label: 'Late Arrivals', value: s.total_late, sub: 'after 10:15 AM', color: 'amber', icon: AlertTriangle },
                    { label: 'WFH Days', value: s.wfh_days, sub: `${s.office_days} office`, color: 'cyan', icon: Home },
                ].map(stat => {
                    const Icon = stat.icon;
                    const colorMap: Record<string, string> = {
                        rose: 'bg-rose-50 text-rose-600 border-rose-100',
                        violet: 'bg-violet-50 text-violet-600 border-violet-100',
                        amber: 'bg-amber-50 text-amber-600 border-amber-100',
                        cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
                    };
                    const textColor: Record<string, string> = {
                        rose: 'text-rose-700', violet: 'text-violet-700', amber: 'text-amber-700', cyan: 'text-cyan-700'
                    };
                    return (
                        <div key={stat.label} className={`rounded-3xl border p-5 ${colorMap[stat.color]} flex flex-col gap-2`}>
                            <Icon size={20} className="opacity-70" />
                            <p className={`text-3xl font-black tracking-tight ${textColor[stat.color]}`}>{stat.value}</p>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest">{stat.label}</p>
                                <p className="text-[10px] opacity-60 font-bold mt-0.5">{stat.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Work Hours Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <BarChart2 size={16} className="text-rose-500" />
                    Daily Work Hours — Last 30 Days
                </h3>
                {chartData.length > 0 ? (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={12} margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} interval={2} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 12]} />
                                <Tooltip content={<HoursTooltip />} />
                                <ReferenceLine y={9} stroke="#e2e8f0" strokeDasharray="4 4" label={{ value: '9h target', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
                                <Bar dataKey="hours" radius={[5, 5, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.hours >= 9 ? '#4f46e5' : entry.hours > 0 ? '#818cf8' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-56 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-sm font-medium">No attendance records yet</div>
                )}
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-rose-600" /><span className="text-[10px] text-slate-500 font-bold">≥ 9h (Full Day)</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-rose-300" /><span className="text-[10px] text-slate-500 font-bold">Partial Day</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-200" /><span className="text-[10px] text-slate-500 font-bold">Absent</span></div>
                </div>
            </div>

            {/* Late Arrivals Trend */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Late Arrival Trend — Last 30 Days
                </h3>
                {chartData.length > 0 ? (
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} interval={2} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip content={<LateTooltip />} />
                                <ReferenceLine y={0} stroke="#f1f5f9" />
                                <Line dataKey="late" stroke="#f59e0b" strokeWidth={2.5} dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    return payload.late > 0
                                        ? <circle key={`dot-${cx}`} cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={2} />
                                        : <circle key={`dot-${cx}`} cx={cx} cy={cy} r={2} fill="#d1fae5" stroke="#10b981" strokeWidth={1.5} />;
                                }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-44 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 text-sm font-medium">No data available</div>
                )}
            </div>

            {/* 7-day mini timeline */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" /> Last 7 Days
                </h3>
                <div className="space-y-2">
                    {week.map(day => (
                        <div key={day.date} className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${day.absent ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                                {day.absent ? <XCircle size={15} className="text-rose-400 shrink-0" /> : <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />}
                                <div>
                                    <p className="text-sm font-black text-slate-900">{fmtDate(day.date)} <span className="text-slate-400 font-bold">({fmtDay(day.date)})</span></p>
                                    {!day.absent && <p className="text-[10px] text-slate-400 font-bold">{fmt(day.check_in)} → {fmt(day.check_out)}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!day.absent && (
                                    <>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${day.mode === 'wfh' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{day.mode}</span>
                                        {day.is_late && <span className="text-[9px] font-black px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">+{day.late_by_minutes}m late</span>}
                                        <span className="font-black text-slate-700 text-sm tabular-nums w-10 text-right">{day.working_hours.toFixed(1)}h</span>
                                    </>
                                )}
                                {day.absent && <span className="text-xs font-black text-rose-400">Absent</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendanceAnalyticsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<EmployeeAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        const payload = {
            employee_id: user.employee_id,
            role: user.role
        };
        try {
            const res = await appsScriptFetch('/attendance-analytics', payload);
            setData(res || []);
        } catch (error) {
            console.error("Failed to fetch attendance analytics:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(true), 15000);
        return () => clearInterval(interval);
    }, [user]);

    const selfData = data.find(d => String(d.employee_id) === String(user?.employee_id)) || data[0];

    return (
        <div className="max-w-6xl mx-auto space-y-6 page-transition pb-10">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/attendance"
                        className="p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Personal Attendance Analytics
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-0.5">
                            Your personal attendance overview · Last 30 days
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Data
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 size={40} className="text-rose-500 animate-spin" />
                    <p className="text-slate-500 font-bold">Loading your analytics…</p>
                </div>
            ) : (
                <>
                    {selfData ? (
                        <SelfAnalytics emp={selfData} />
                    ) : (
                        <div className="py-24 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-3xl bg-white">
                            No attendance records found for your account in the last 30 days.
                        </div>
                    )}
                </>
            )}

        </div>
    );
}
