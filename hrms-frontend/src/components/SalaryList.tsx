"use client";

import React from "react";
import { Receipt, Eye, CheckCircle2, Clock, Ban } from "lucide-react";

interface SalaryListProps {
  slips: any[];
  onView: (slip: any) => void;
  role?: string;
}

export default function SalaryList({ slips, onView, role }: SalaryListProps) {
  const formatMonthYear = (monthYearStr: string) => {
    if (!monthYearStr) return '';
    
    // Handle custom "MM/YYYY" format
    if (monthYearStr.includes('/')) {
      const parts = monthYearStr.split('/');
      if (parts.length === 2) {
        const [month, year] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
      }
    }

    // Handle ISO date strings (e.g., "2026-02-01T00:00:00+05:30")
    const date = new Date(monthYearStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    return monthYearStr;
  };

  if (slips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
          <Receipt size={32} />
        </div>
        <p className="text-slate-500 font-medium">No salary records found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-sm pb-4">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Month</th>
            {(role === 'Finance' || role === 'Super Admin') && (
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
            )}
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Basic Salary</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Payable Days</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Amount</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {slips.map((slip) => (
            <tr key={slip.slip_id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-900">{formatMonthYear(slip.month_year)}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 whitespace-nowrap">
                  Gen: {new Date(slip.generated_date).toLocaleDateString()}
                </div>
              </td>
              {(role === 'Finance' || role === 'Super Admin') && (
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700">{slip.employee_name}</div>
                  <div className="text-xs text-slate-400">{slip.department}</div>
                </td>
              )}
              <td className="px-6 py-4">
                <div className="font-bold text-slate-600">₹{parseFloat(slip.basic_salary).toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-700">{slip.total_payable_days}</td>
              <td className="px-6 py-4">
                <div className="font-black text-rose-600">₹{parseFloat(slip.final_amount).toLocaleString()}</div>
              </td>
              <td className="px-6 py-4">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${slip.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                    slip.status === 'Processed' ? 'bg-blue-100 text-blue-700' :
                      slip.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                  }`}>
                  {slip.status === 'Paid' ? <CheckCircle2 size={10} /> :
                    slip.status === 'Processed' ? <Clock size={10} /> :
                      slip.status === 'Pending' ? <Clock size={10} /> : <Ban size={10} />}
                  {slip.status}
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onView(slip)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all transform group-hover:scale-110"
                >
                  <Eye size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
