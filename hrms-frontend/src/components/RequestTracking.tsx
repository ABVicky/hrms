"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  History,
  Receipt,
  Calendar
} from "lucide-react";

export default function RequestTracking() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user?.employee_id) return;
            try {
                const data = await appsScriptFetch("/get-user-requests", { employee_id: user.employee_id });
                if (data) setRequests(data);
            } catch (error) {
                console.error("Failed to fetch requests", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user?.employee_id]);

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('approved')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s.includes('rejected')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (s.includes('review') || s.includes('pending')) return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    const getStatusIcon = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('approved')) return <CheckCircle size={12} />;
        if (s.includes('rejected')) return <XCircle size={12} />;
        if (s.includes('review') || s.includes('pending')) return <Clock size={12} />;
        return <AlertCircle size={12} />;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <History size={16} className="text-rose-500" />
                    Tracking
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{requests.length} Recent</span>
            </div>

            <div className="space-y-3">
                {requests.length > 0 ? (
                    requests.slice(0, 3).map((request) => {
                        const type = request.form_type?.toLowerCase() || "";
                        let Icon = FileText;
                        let iconBg = "bg-slate-50 text-slate-400";

                        if (type.includes("leave")) {
                            Icon = Calendar;
                            iconBg = "bg-emerald-50 text-emerald-500";
                        } else if (type.includes("reimbursement") || type.includes("expense")) {
                            Icon = Receipt;
                            iconBg = "bg-amber-50 text-amber-500";
                        }

                        return (
                            <div key={request.id} className="p-3 rounded-2xl border border-slate-50 group hover:border-rose-100 hover:shadow-sm transition-all relative overflow-hidden">
                                <div className="flex items-center gap-3">
                                    <div className={`shrink-0 w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                                        <Icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="font-bold text-slate-900 text-xs truncate uppercase leading-none">{request.title}</h4>
                                            <span className="text-[9px] text-slate-400 font-bold">{new Date(request.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(request.status)} flex items-center gap-1.5`}>
                                                {getStatusIcon(request.status)}
                                                {request.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{request.form_type}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No requests tracked</p>
                    </div>
                )}
            </div>
            
            <button className="mt-4 pt-4 border-t border-slate-50 w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 group">
                Full History <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
