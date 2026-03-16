"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import SalaryList from "@/components/SalaryList";
import SalarySlip from "@/components/SalarySlip";
import { 
  X, 
  Save, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Wallet 
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function SalaryPage() {
  const { user } = useAuth();
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ adjustments: 0, fines: 0 });

  const isFinance = user?.role === 'Super Admin' || user?.department === 'Finance';

  useEffect(() => {
    fetchSlips();
  }, [user]);

  const fetchSlips = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await appsScriptFetch("/get-salary-slips", { 
        employee_id: user.employee_id, 
        role: user.role 
      });
      setSlips(data || []);
    } catch (err) {
      console.error("Failed to fetch salary slips", err);
      toast.error("Failed to load salary data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSlip = (slip: any) => {
    setSelectedSlip(slip);
    setEditData({ adjustments: slip.adjustments, fines: slip.fines });
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const handleUpdateSlip = async () => {
    try {
      toast.loading("Updating slip...", { id: "update" });
      await appsScriptFetch("/update-salary-slip", {
        slip_id: selectedSlip.slip_id,
        adjustments: editData.adjustments,
        fines: editData.fines
      });
      toast.success("Slip updated successfully!", { id: "update" });
      setIsEditing(false);
      fetchSlips();
      // Update selected slip locally
      const updatedFinal = parseFloat(selectedSlip.final_amount) + 
                           (parseFloat(editData.adjustments.toString()) - parseFloat(selectedSlip.adjustments)) - 
                           (parseFloat(editData.fines.toString()) - parseFloat(selectedSlip.fines));
      setSelectedSlip({ ...selectedSlip, adjustments: editData.adjustments, fines: editData.fines, final_amount: updatedFinal });
    } catch (err) {
      toast.error("Failed to update slip", { id: "update" });
    }
  };

  const handleApproveSlip = async () => {
    try {
      toast.loading("Approving slip...", { id: "approve" });
      await appsScriptFetch("/approve-salary", { slip_id: selectedSlip.slip_id });
      toast.success("Salary approved!", { id: "approve" });
      fetchSlips();
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to approve salary", { id: "approve" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Stats for Finance
  const totalPayout = slips.reduce((sum, s) => sum + parseFloat(s.final_amount), 0);
  const pendingApprovals = slips.filter(s => s.status === 'draft').length;

  return (
    <>
      {/* Detail Modal - MOVED OUTSIDE ANIMATED CONTAINER */}
      {isModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-slate-50 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>

            {/* Slip Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
               <SalarySlip slip={selectedSlip} showDownload={selectedSlip.status === 'released' || isFinance} />
            </div>

            {/* Finance Controls Side Panel */}
            {isFinance && (
              <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-8 flex flex-col gap-8">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 font-bold">Finance Actions</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Adjustments / Bonus</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
                           <input 
                            type="number"
                            value={editData.adjustments}
                            onChange={(e) => setEditData({...editData, adjustments: parseFloat(e.target.value) || 0})}
                            className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                           />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Deductions / Fines</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 font-bold">₹</span>
                           <input 
                            type="number"
                            value={editData.fines}
                            onChange={(e) => setEditData({...editData, fines: parseFloat(e.target.value) || 0})}
                            className="w-full pl-8 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                           />
                        </div>
                      </div>

                      <button 
                        onClick={handleUpdateSlip}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg"
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                    </div>
                 </div>

                 <div className="mt-auto space-y-4 pt-8 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Final Approval</p>
                    
                    {selectedSlip.status === 'draft' ? (
                      <button 
                        onClick={handleApproveSlip}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle size={18} />
                        Approve Salary
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-4 bg-slate-200 text-slate-500 rounded-2xl font-bold cursor-not-allowed">
                        <CheckCircle size={18} />
                        {selectedSlip.status === 'approved' ? 'Already Approved' : 'Released'}
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-br from-rose-600 to-rose-900 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            {isFinance ? "Salary Management" : "My Earnings"}
          </h1>
          <p className="text-rose-100/80 font-medium max-w-md text-lg">
            {isFinance 
              ? "Review, adjust, and approve employee payroll statements."
              : "View and download your monthly salary statements."}
          </p>
        </div>
        
        {isFinance && (
          <div className="flex gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Total Payout</p>
              <p className="text-2xl font-black">₹{totalPayout.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Pending Review</p>
              <p className="text-2xl font-black">{pendingApprovals}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
               <Calendar className="text-rose-600" size={20} />
               Salary Statements
            </h2>
          </div>
          <SalaryList slips={slips} onView={handleOpenSlip} role={user?.role} />
        </div>
      </div>

      </div>
    </>
  );
}
