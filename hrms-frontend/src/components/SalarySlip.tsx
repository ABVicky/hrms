"use client";

import React, { useRef } from "react";
import { Download, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-hot-toast";

interface SalarySlipProps {
  slip: {
    slip_id: string;
    employee_id: string;
    employee_name: string;
    department: string;
    month_year: string;
    total_full_days: number;
    total_half_days: number;
    total_payable_days: number;
    basic_salary: number;
    adjustments: number;
    fines: number;
    final_amount: number;
    status: string;
    generated_date: string;
    released_date?: string;
  };
  showDownload?: boolean;
}

export default function SalarySlip({ slip, showDownload = true }: SalarySlipProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!slipRef.current) return;
    
    const loadingToast = toast.loading("Generating PDF...");
    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Salary_Slip_${slip.employee_name}_${slip.month_year.replace("/", "_")}.pdf`);
      toast.success("Downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {showDownload && (
        <div className="flex justify-end">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-lg active:scale-95"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      )}

      <div 
        ref={slipRef}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto w-full text-slate-800"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
               <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                ASPIRE<span className="text-rose-600">.</span>
               </h1>
            </div>
            <p className="text-slate-500 font-medium">Monthly Salary Statement</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
              slip.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
              slip.status === 'Processed' ? 'bg-blue-100 text-blue-700' :
              slip.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {slip.status === 'Paid' ? <CheckCircle2 size={12} /> : null}
              {slip.status}
            </div>
            <p className="text-sm text-slate-400">Slip ID: {slip.slip_id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Employee Details</h3>
            <p className="font-bold text-slate-900 text-lg">{slip.employee_name}</p>
            <p className="text-slate-500 font-medium">ID: {slip.employee_id}</p>
            <p className="text-slate-500 font-medium">{slip.department}</p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Statement Period</h3>
            <div className="flex items-center justify-end gap-2 text-slate-900 font-bold text-lg">
              <Calendar size={18} className="text-rose-500" />
              {slip.month_year}
            </div>
            <p className="text-slate-500 text-sm mt-1">Generated: {new Date(slip.generated_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-10 grid grid-cols-3 gap-6">
          <div className="text-center border-r border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Days</p>
            <p className="text-xl font-bold text-slate-900">{slip.total_full_days}</p>
          </div>
          <div className="text-center border-r border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Half Days</p>
            <p className="text-xl font-bold text-slate-900">{slip.total_half_days}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Payable Days</p>
            <p className="text-xl font-bold text-rose-600">{slip.total_payable_days}</p>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="space-y-4 mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salary Breakdown</h3>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 font-medium">Basic Salary</span>
            <span className="font-bold text-slate-900">₹{parseFloat(slip.basic_salary.toString()).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-slate-50">
            <span className="text-slate-600 font-medium text-sm">Attendance Based (Calc.)</span>
            <span className="font-bold text-slate-900">₹{(parseFloat(slip.final_amount.toString()) - (parseFloat(slip.adjustments.toString()) || 0) + (parseFloat(slip.fines.toString()) || 0)).toLocaleString()}</span>
          </div>

          {(parseFloat(slip.adjustments.toString()) !== 0) && (
            <div className="flex justify-between items-center py-2 border-t border-slate-50">
              <span className="text-emerald-600 font-medium">Adjustments / Bonuses</span>
              <span className="font-bold text-emerald-600">+₹{parseFloat(slip.adjustments.toString()).toLocaleString()}</span>
            </div>
          )}

          {(parseFloat(slip.fines.toString()) !== 0) && (
            <div className="flex justify-between items-center py-2 border-t border-slate-50">
              <span className="text-rose-600 font-medium">Deductions / Fines</span>
              <span className="font-bold text-rose-600">-₹{parseFloat(slip.fines.toString()).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-rose-600 rounded-2xl p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Payable Amount</p>
            <p className="text-xs opacity-60">Net salary transferred to bank account</p>
          </div>
          <div className="text-3xl font-black">
            ₹{parseFloat(slip.final_amount.toString()).toLocaleString()}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            This is a computer generated document and does not require a physical signature.
          </p>
        </div>
      </div>
    </div>
  );
}
