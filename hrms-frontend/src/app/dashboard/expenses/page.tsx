"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Receipt, AlertCircle, Upload, Info, Loader2 } from "lucide-react";

export default function ExpensesPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const [fileData, setFileData] = useState<{ base64: string, mime: string, name: string } | null>(null);
    const [formData, setFormData] = useState({
        amount: '',
        category: 'travel',
        description: ''
    });

    const loadExpenses = async () => {
        try {
            const res = await appsScriptFetch('/get-expenses', { employee_id: user?.employee_id });
            setExpenses(res || []);
        } catch (err) {
            console.error("Failed to load expenses", err);
        } finally {
            setLoadingExpenses(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) loadExpenses();
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File must be less than 2MB' });
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setFileData({
                    base64: reader.result as string,
                    mime: file.type,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const payload: any = {
                employee_id: user?.employee_id,
                ...formData,
            };

            if (fileData) {
                payload.receipt_base64 = fileData.base64;
                payload.receipt_mime = fileData.mime;
                payload.receipt_filename = fileData.name;
            } else {
                throw new Error("Receipt image is required");
            }

            const res = await appsScriptFetch('/expense-submit', payload);
            setMessage({ type: 'success', text: res.status || 'Expense submitted successfully.' });
            setFormData({ amount: '', category: 'travel', description: '' });
            setFileData(null);
            loadExpenses();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to submit expense.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 page-transition pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 md:px-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-3 md:p-4 bg-white shadow-sm ring-1 ring-slate-100 text-emerald-600 rounded-[1.25rem] md:rounded-[1.5rem]">
                        <Receipt size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Expenses</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">Claim your reimbursements with ease.</p>
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

            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 premium-card">
                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Claim Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Expense Category</label>
                            <select
                                required
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700 appearance-none text-sm md:text-base"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="travel">Travel</option>
                                <option value="meals">Meals</option>
                                <option value="supplies">Office Supplies</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                        <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                            placeholder="Briefly describe the expense..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                        <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Supporting Document (Receipt)</label>
                        <div className="relative group">
                            <label className="flex flex-col items-center justify-center w-full min-h-[9rem] md:min-h-[11rem] p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer group-hover:border-emerald-400 group-hover:bg-emerald-50/20 transition-all duration-500 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-1 ring-slate-100">
                                        <Upload size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-slate-700 tracking-tight">
                                            {fileData ? fileData.name : "Drop receipt here or tap to select"}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                            MAX 2MB • JPG, PNG, PDF
                                        </p>
                                    </div>
                                </div>
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            </label>
                            {fileData && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setFileData(null); }}
                                    className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-xl shadow-lg border border-rose-100 hover:bg-rose-50 transition-colors z-20"
                                >
                                    <AlertCircle size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 md:py-6 px-8 font-black uppercase tracking-widest text-xs md:text-sm rounded-[1.5rem] md:rounded-[2rem] text-white transition-all shadow-2xl active:scale-[0.98] mt-4 flex items-center justify-center gap-3 ${
                            loading 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:to-emerald-400 shadow-emerald-200/50 hover:shadow-emerald-200/80'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Processing...</span>
                            </>
                        ) : 'Submit Claim'}
                    </button>
                </form>
            </div>

            {/* Expense History Section */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-10 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Recent Claims</h2>
                    <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] md:text-11px font-black uppercase tracking-[0.15em] ring-1 ring-slate-100 shadow-sm">Status Track</div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-50">
                    {loadingExpenses ? (
                        <div className="p-10 text-center animate-pulse text-slate-400">Loading history...</div>
                    ) : expenses.length > 0 ? (
                        expenses.map((expense: any) => (
                            <div key={expense.expense_id} className="p-6 space-y-5 active:bg-slate-50 transition-colors clickable group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 text-xl tracking-tighter tabular-nums">₹{expense.amount}</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${
                                                expense.status === 'approved' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' :
                                                expense.status === 'rejected' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                'bg-amber-50 text-amber-600 ring-amber-100'
                                            }`}>
                                                {expense.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{expense.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</p>
                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${expense.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <p className={`font-bold text-xs uppercase ${expense.payment_status === 'paid' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {expense.payment_status || 'pending'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <p className="text-xs text-slate-600 leading-relaxed italic">"{expense.description}"</p>
                                </div>
                                {expense.receipt_file && (
                                    <a href={expense.receipt_file} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 transition-all shadow-sm">
                                        <Info size={14} />
                                        View Attachment
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-400 font-medium text-sm">No expense claims found.</div>
                    )}
                </div>

                {/* Desktop View (Premium Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/30 text-slate-400 font-bold uppercase tracking-[0.15em] text-[11px]">
                            <tr>
                                <th className="px-10 py-6">Timeline</th>
                                <th className="px-10 py-6">Amount</th>
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Payment</th>
                                <th className="px-10 py-6 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {expenses.map((expense: any) => (
                                <tr key={expense.expense_id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <div className="space-y-0.5">
                                            <p className="font-black text-slate-900 text-lg tracking-tight capitalize">{expense.category}</p>
                                            <p className="text-[11px] font-bold text-slate-400 tracking-wider">
                                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="font-black text-slate-900 text-xl tracking-tighter tabular-nums">₹{expense.amount}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider ${
                                            expense.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                            expense.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                            'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                expense.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                expense.status === 'rejected' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                            }`}></div>
                                            {expense.status.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${expense.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <p className={`font-black text-[11px] uppercase tracking-wider ${expense.payment_status === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {expense.payment_status || 'pending'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        {expense.receipt_file ? (
                                            <a href={expense.receipt_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 transition-all shadow-sm">
                                                <Info size={14} />
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Receipt</span>
                                        )}
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

