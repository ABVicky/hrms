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
        if (s.includes('approved')) return <CheckCircle size={14} />;
        if (s.includes('rejected')) return <XCircle size={14} />;
        if (s.includes('review') || s.includes('pending')) return <Clock size={14} />;
        return <AlertCircle size={14} />;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm animate-pulse">
                <div className="h-6 w-32 bg-slate-100 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm premium-card overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                        <History size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Request Tracking</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your recent submissions</p>
                    </div>
                </div>
                <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <History size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                {requests.length > 0 ? (
                    requests.map((request) => {
                        const type = request.form_type?.toLowerCase() || "";
                        let Icon = FileText;
                        let iconBg = "bg-slate-100 text-slate-500";
                        let gradient = "from-slate-50 to-white";

                        if (type.includes("leave")) {
                            Icon = Calendar;
                            iconBg = "bg-emerald-50 text-emerald-600";
                            gradient = "from-emerald-50/30 to-white";
                        } else if (type.includes("reimbursement") || type.includes("expense")) {
                            Icon = Receipt;
                            iconBg = "bg-amber-50 text-amber-600";
                            gradient = "from-amber-50/30 to-white";
                        }

                        return (
                            <div key={request.id} className={`group p-5 rounded-[2rem] border border-slate-100 bg-gradient-to-br ${gradient} hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-500 cursor-pointer overflow-hidden relative`}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                                
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className={`shrink-0 w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ring-4 ring-white`}>
                                        <Icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                                                {request.department_responsible}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {request.form_type}
                                            </span>
                                        </div>
                                        <h4 className="font-extrabold text-slate-900 leading-tight group-hover:text-rose-600 transition-colors text-base">
                                            {request.title}
                                        </h4>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${getStatusStyles(request.status)}`}>
                                                {getStatusIcon(request.status)}
                                                {request.status.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                                                <Clock size={12} />
                                                {new Date(request.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4 text-slate-200">
                            <FileText size={32} />
                        </div>
                        <h4 className="font-bold text-slate-400">No requests yet</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">Submit a form to start tracking</p>
                    </div>
                )}
            </div>
            
            <button className="mt-6 w-full py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors border-t border-slate-50 group flex items-center justify-center gap-2">
                View All History <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
