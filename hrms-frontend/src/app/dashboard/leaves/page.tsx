"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Calendar, AlertCircle } from "lucide-react";
import { isHRAdmin, isSuperAdmin, canApproveLeave, isFinanceAdmin } from "@/lib/roles";

export default function LeavesPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [adminRemarks, setAdminRemarks] = useState<{ [key: string]: string }>({});

    const [formData, setFormData] = useState({
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const loadRequests = async () => {
        setLoadingRequests(true);
        try {
            const isAdmin = isHRAdmin(user) || isSuperAdmin(user);
            const endpoint = isAdmin ? '/get-all-leave-requests' : '/get-leave-requests';
            const params = isAdmin ? {} : { employee_id: user?.employee_id };
            
            const res = await appsScriptFetch(endpoint, params);
            setRequests(res || []);
        } catch (err) {
            console.error("Failed to load leave requests", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) loadRequests();
    }, [user]);

    const handleApproveReject = async (requestId: string, status: 'approved' | 'rejected') => {
        if (!canApproveLeave(user)) return;
        
        setLoading(true);
        setMessage(null);
        try {
            await appsScriptFetch('/leave-approve-reject', {
                request_id: requestId,
                status,
                admin_id: user?.employee_id,
                remarks: adminRemarks[requestId] || ''
            });
            setMessage({ type: 'success', text: `Leave ${status} successfully.` });
            loadRequests();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || `Failed to ${status} leave.` });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSuperAdmin(user) || isFinanceAdmin(user)) {
             setMessage({ type: 'error', text: 'Operational actions restricted for your role.' });
             return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await appsScriptFetch('/leave-request', {
                employee_id: user?.employee_id,
                ...formData
            });
            setMessage({ type: 'success', text: res.status || 'Leave requested successfully.' });
            setFormData({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
            loadRequests(); 
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to submit leave request.' });
        } finally {
            setLoading(false);
        }
    };

    const showApplyForm = !isSuperAdmin(user) && !isHRAdmin(user) && !isFinanceAdmin(user);
    const isAdminView = isHRAdmin(user) || isSuperAdmin(user);

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 page-transition pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 md:px-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-3 md:p-4 bg-white shadow-sm ring-1 ring-slate-100 text-rose-600 rounded-[1.25rem] md:rounded-[1.5rem]">
                        <Calendar size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Time Off</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">
                            {isAdminView ? "Review and manage team leave requests." : "Apply for or track your leave requests."}
                        </p>
                    </div>
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

            {showApplyForm && (
                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 premium-card">
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Leave Type</label>
                                <select
                                    required
                                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-700 appearance-none text-sm md:text-base"
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                >
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="annual">Annual Leave</option>
                                </select>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Attachments (Optional)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full px-4 md:px-5 py-3 md:py-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl md:rounded-2xl flex items-center gap-3 text-slate-400 group-hover:border-rose-400 group-hover:bg-rose-50/30 transition-all text-xs md:text-sm font-bold">
                                        <AlertCircle size={18} className="text-slate-300 group-hover:text-rose-400" />
                                        <span>Supportive Documents</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Leave</label>
                            <textarea
                                required
                                rows={3}
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                                placeholder="Explain why you need this time off..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 md:py-5 px-6 md:px-8 font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-xs md:text-sm rounded-xl md:rounded-2xl text-white transition-all shadow-xl active:scale-95 ${loading ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                }`}
                        >
                            {loading ? 'Submitting...' : 'Apply for Leave'}
                        </button>
                    </form>
                </div>
            )}

            {/* Leave History Section */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-10 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Recent Requests</h2>
                    <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] md:text-11px font-black uppercase tracking-[0.15em] ring-1 ring-slate-100 shadow-sm">Status Track</div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-50">
                    {loadingRequests ? (
                        <div className="p-10 text-center animate-pulse text-slate-400">Loading history...</div>
                    ) : (requests?.filter(Boolean) || []).length > 0 ? (
                        requests.filter(Boolean).map((request: any) => (
                            <div key={request.request_id} className="p-6 space-y-4 active:bg-slate-50 transition-colors clickable group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        {isAdminView && <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{request.employee_name || request.employee_id}</p>}
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 capitalize text-lg tracking-tight">{request.leave_type} Leave</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${
                                                request.status === 'approved' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' :
                                                request.status === 'rejected' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                'bg-amber-50 text-amber-600 ring-amber-100'
                                            }`}>
                                                {(request.status || 'pending').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold">{request.start_date} to {request.end_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitted</p>
                                        <p className="font-bold text-slate-700 text-xs">{new Date(request.created_at || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <p className="text-xs text-slate-600 leading-relaxed italic">"{request.reason}"</p>
                                </div>

                                {isHRAdmin(user) && request.status === 'pending' && (
                                    <div className="flex flex-col gap-3 pt-2">
                                        <input 
                                            type="text" 
                                            placeholder="Add remarks..."
                                            className="text-xs px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold"
                                            value={adminRemarks[request.request_id] || ''}
                                            onChange={(e) => setAdminRemarks({...adminRemarks, [request.request_id]: e.target.value})}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleApproveReject(request.request_id, 'approved')}
                                                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleApproveReject(request.request_id, 'rejected')}
                                                className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-400 font-medium text-sm">No leave requests found.</div>
                    )}
                </div>

                {/* Desktop View (Premium Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/30 text-slate-400 font-bold uppercase tracking-[0.15em] text-[11px]">
                            <tr>
                                {isAdminView && <th className="px-10 py-6">Employee</th>}
                                <th className="px-10 py-6">Timeline</th>
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Reason</th>
                                {isHRAdmin(user) && <th className="px-10 py-6">Actions</th>}
                                <th className="px-10 py-6 text-right">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(requests?.filter(Boolean) || []).map((request: any) => (
                                <tr key={request.request_id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                    {isAdminView && (
                                        <td className="px-10 py-8">
                                            <p className="font-black text-slate-900 text-sm tracking-tight capitalize">{request.employee_name || request.employee_id}</p>
                                        </td>
                                    )}
                                    <td className="px-10 py-8">
                                        <div className="space-y-0.5">
                                            <p className="font-black text-slate-900 text-lg tracking-tight capitalize">{request.leave_type} Leave</p>
                                            <p className="text-[11px] font-bold text-slate-400 tracking-wider">
                                                {request.start_date} <span className="mx-1 text-slate-300">→</span> {request.end_date}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider ${
                                            request.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                            request.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                            'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                request.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                request.status === 'rejected' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                            }`}></div>
                                            {(request.status || 'pending').replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 max-w-xs">
                                        <p className="text-sm text-slate-600 font-medium truncate italic" title={request.reason}>
                                            "{request.reason}"
                                        </p>
                                    </td>
                                    {isHRAdmin(user) && (
                                        <td className="px-10 py-8">
                                            {request.status === 'pending' ? (
                                                <div className="flex flex-col gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Add remarks..."
                                                        className="text-[10px] px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-rose-300"
                                                        value={adminRemarks[request.request_id] || ''}
                                                        onChange={(e) => setAdminRemarks({...adminRemarks, [request.request_id]: e.target.value})}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleApproveReject(request.request_id, 'approved')}
                                                            className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApproveReject(request.request_id, 'rejected')}
                                                            className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 italic">No actions available</p>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-10 py-8 text-right">
                                        <p className="font-black text-slate-900 text-sm tracking-tight">
                                            {new Date(request.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
