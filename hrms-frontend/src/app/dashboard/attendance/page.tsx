"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { MapPin, Clock, Home, AlertCircle, Loader2, Power } from "lucide-react";
import ActiveTimer from "@/components/ActiveTimer";

// PLACEHOLDER: Ideally from DB or environment variable
const OFFICE_COORDS = { lat: 22.596755385565324, lng: 88.39958873340666 };
const MAX_DISTANCE_METERS = 200;

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
}

export default function AttendancePage() {
    const { user, refreshAttendanceStatus, performAttendanceAction } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [mode, setMode] = useState<'office' | 'wfh'>('office');
    const [backendInfo, setBackendInfo] = useState<{ version: string, url: string } | null>(null);

    useEffect(() => {
        console.log("[v1.3] Initializing Attendance Page.");
        checkBackendVersion();
        loadAttendance();
    }, [user]);

    const checkBackendVersion = async () => {
        try {
            const res = await appsScriptFetch("/status", {});
            setBackendInfo({ 
                version: res?.version || "unknown", 
                url: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "MISSING"
            });
            console.log("[v1.3] Backend Info:", res);
        } catch (err) {
            console.warn("[v1.3] Could not fetch backend version. Outdated script likely.");
            setBackendInfo({ version: "outdated", url: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "MISSING" });
        }
    };

    // Use local date for display/defaulting
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. First look for ANY open session (Check-in exists, Check-out doesn't)
    // 2. If no open session, look for the most recent closed session for today
    const openSession = (attendanceRecords || [])
        .filter(a => a && a.check_in && !a.check_out && !isNaN(new Date(a.check_in).getTime()))
        .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())[0];

    const todayRecord = openSession || (attendanceRecords || [])
        .filter(a => a && String(a.date) === todayStr)
        .sort((a, b) => {
            const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
            const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        })[0];

    const isActiveSession = !!openSession;


    async function loadAttendance() {
        try {
            const data = await appsScriptFetch("/attendance", { employee_id: user?.employee_id });
            setAttendanceRecords(data || []);
        } catch (error) {
            console.error("Load attendance failed", error);
        }
    }

    const handleToggle = async () => {
        if (isActiveSession) {
            handleAction('checkout');
        } else {
            handleAction('checkin', mode);
        }
    };

    const handleAction = async (action: 'checkin' | 'checkout', checkinMode: 'office' | 'wfh' = 'office') => {
        setLoading(true);
        setMessage(null);

        const performAction = async (lat?: number, lng?: number) => {
            try {
                const act = action === 'checkin' ? 'checkin' : 'checkout';
                const res = await performAttendanceAction(act, action === 'checkin' ? checkinMode : todayRecord?.mode);
                
                if (!res) throw new Error("No response from server");
                console.log(`[v1.1] Action: ${action} response:`, res);
                setMessage({ type: 'success', text: res.status || 'Success' });

                // Clear success message after 5s
                setTimeout(() => setMessage(null), 5000);

                // Reload local history for the table/cards
                await loadAttendance();
            } catch (err: any) {
                console.error("[v1.1] Attendance action failed:", err);
                setMessage({ type: 'error', text: err.message });
            } finally {
                setLoading(false);
            }
        };

        if (action === 'checkin' && checkinMode === 'office') {
            if (!navigator.geolocation) {
                setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const distance = getDistanceFromLatLonInM(
                        position.coords.latitude,
                        position.coords.longitude,
                        OFFICE_COORDS.lat,
                        OFFICE_COORDS.lng
                    );

                    if (distance > MAX_DISTANCE_METERS) {
                        setMessage({ type: 'error', text: `You are too far from the office (${Math.round(distance)}m away. Max allowed: ${MAX_DISTANCE_METERS}m)` });
                        setLoading(false);
                        return;
                    }
                    performAction(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    setMessage({ type: 'error', text: 'Error getting location: ' + error.message });
                    setLoading(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            performAction();
        }
    };

    return (
        <div className="space-y-4 md:space-y-8 max-w-5xl mx-auto page-transition pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                    <p className="text-slate-500 font-medium">Manage your daily work session.</p>
                </div>
                <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 w-fit">
                    <div className={`w-2 h-2 rounded-full ${isActiveSession ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <p className="text-sm font-bold text-slate-700">{new Date().toDateString()}</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 md:p-5 rounded-2xl shadow-lg shadow-black/5 animate-in slide-in-from-top-4 duration-300 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className={message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'} />
                        <span className="font-bold text-sm md:text-base">{message.text}</span>
                    </div>
                </div>
            )}


            {/* Central Toggle Toggle Control */}
            <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 premium-card text-center">
                <div className="max-w-md mx-auto space-y-10">
                    {/* Mode Selector (Only if not checked in) */}
                    {!isActiveSession && !todayRecord?.check_out && (
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl items-center relative z-0">
                            <button
                                onClick={() => setMode('office')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'office' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MapPin size={16} /> Office
                            </button>
                            <button
                                onClick={() => setMode('wfh')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'wfh' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Home size={16} /> WFH
                            </button>
                        </div>
                    )}

                    {/* Main Pulse Toggle */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-8">
                            {isActiveSession && (
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150 opacity-20"></div>
                            )}
                            <button
                                onClick={handleToggle}
                                disabled={loading || (!!todayRecord?.check_in && !!todayRecord?.check_out)}
                                className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 border-8 ${isActiveSession
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-100 shadow-amber-200'
                                    : !!todayRecord?.check_out
                                        ? 'bg-slate-100 text-slate-400 border-slate-50 shadow-none'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-100 shadow-emerald-200'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin w-10 h-10" />
                                ) : (
                                    <>
                                        <Power size={48} strokeWidth={2.5} className="mb-2" />
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {isActiveSession ? 'Check Out' : !!todayRecord?.check_out ? 'Session Over' : 'Check In'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {isActiveSession ? (
                                <ActiveTimer checkInTime={todayRecord.check_in} />
                            ) : (
                                <h2 className="text-4xl font-black tracking-tighter tabular-nums text-slate-300">
                                    00:00:00
                                </h2>
                            )}
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active session duration</p>
                        </div>
                    </div>

                    {/* Status Details */}
                    {todayRecord?.check_in && (
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                            <div className="text-left space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checked In At</p>
                                <p className="font-bold text-slate-900">
                                    {(() => {
                                        if (!todayRecord?.check_in) return "—";
                                        const d = new Date(todayRecord.check_in);
                                        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    })()}
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mode</p>
                                <p className="font-bold text-slate-900 flex items-center justify-end gap-1.5 capitalize">
                                    {todayRecord.mode === 'office' ? <MapPin size={14} className="text-indigo-500" /> : <Home size={14} className="text-cyan-500" />}
                                    {todayRecord.mode}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Recent History</h2>
                    <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] md:text-11px font-black uppercase tracking-[0.15em] ring-1 ring-slate-100 shadow-sm">Past 30 Days</div>
                </div>

                {/* Mobile History View (Cards) */}
                <div className="md:hidden divide-y divide-slate-50">
                    {attendanceRecords.length > 0 ? (
                        attendanceRecords.slice().reverse().map((record: any) => {
                            const dateObj = new Date(record.date);
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                            
                            const safeLocalTime = (iso: string) => {
                                if (!iso || iso === "---" || String(iso).trim() === "") return "—";
                                const d = new Date(iso);
                                return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            };
                            return (
                                <div key={record.attendance_id} className="p-6 space-y-5 active:bg-slate-50 transition-colors clickable group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-900 text-lg leading-none tracking-tight">{record.date}</p>
                                                <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${record.mode === 'office' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-cyan-50 border-cyan-100 text-cyan-600'}`}>
                                                    {record.mode}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{dayName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{record.working_hours || '0.00'}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Hours</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-100"></div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check In</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 tabular-nums">{safeLocalTime(record.check_in)}</p>
                                        </div>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check Out</p>
                                                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 text-right tabular-nums">{safeLocalTime(record.check_out)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                      <div className="p-10 text-center text-slate-400 font-medium">No records found.</div>
                    )}
                </div>

                {/* Desktop History View (Premium Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/30 text-slate-400 font-bold uppercase tracking-[0.15em] text-[11px]">
                            <tr>
                                <th className="px-10 py-6">Timeline</th>
                                <th className="px-10 py-6">Mode</th>
                                <th className="px-10 py-6">Check In</th>
                                <th className="px-10 py-6">Check Out</th>
                                <th className="px-10 py-6 text-right">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendanceRecords.slice().reverse().map((record: any) => {
                                const dateObj = new Date(record.date);
                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                                
                                const safeLocalTime = (iso: string) => {
                                    if (!iso || iso === "---" || String(iso).trim() === "") return "—";
                                    const d = new Date(iso);
                                    return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                                };

                                return (
                                    <tr key={record.attendance_id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                        <td className="px-10 py-8">
                                            <div className="space-y-0.5">
                                                <p className="font-black text-slate-900 text-lg tracking-tight">{record.date}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest">{dayName}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider ${
                                                record.mode === 'office' 
                                                ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600' 
                                                : 'bg-cyan-50/50 border-cyan-100 text-cyan-600'
                                            }`}>
                                                {record.mode === 'office' ? <MapPin size={12} strokeWidth={3} /> : <Home size={12} strokeWidth={3} />}
                                                {record.mode}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 font-bold text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                {safeLocalTime(record.check_in)}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 font-bold text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                                {safeLocalTime(record.check_out)}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="font-black text-slate-900 text-xl tracking-tight">{record.working_hours || '0.00'}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

