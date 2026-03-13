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
  History
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
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <History size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Request Tracking</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your recent submissions</p>
                    </div>
                </div>
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <History size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {requests.length > 0 ? (
                    requests.map((request) => (
                        <div key={request.id} className="group p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all duration-300">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                            <FileText size={10} /> {request.form_type}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{request.department_responsible}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {request.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusStyles(request.status)}`}>
                                            {getStatusIcon(request.status)}
                                            {request.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(request.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-sm group-hover:translate-x-1">
                                    <ChevronRight size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    ))
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
            
            <button className="mt-6 w-full py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors border-t border-slate-50 group flex items-center justify-center gap-2">
                View All History <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
