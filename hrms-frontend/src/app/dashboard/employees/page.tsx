"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Users, Mail, Plus } from "lucide-react";

export default function EmployeesPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadEmployees() {
            try {
                const data = await appsScriptFetch("/employee");
                setEmployees(data || []);
            } catch (error) {
                console.error("Failed to load employees", error);
            } finally {
                setLoading(false);
            }
        }

        // Only fetch if admin
        if (user?.role === "Super Admin" || user?.role === "HR Admin") {
            loadEmployees();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (user?.role !== "Super Admin" && user?.role !== "HR Admin") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <AlertCircle size={48} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Employee Directory</h1>
                        <p className="text-sm text-slate-500">Manage agency staff</p>
                    </div>
                </div>

                <button className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-violet-700 transition">
                    <Plus size={18} />
                    Add Employee
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 animate-pulse">Loading directory...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map((emp) => (
                                    <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-slate-900 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                                                    {emp.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    {emp.name}
                                                    <div className="text-xs text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                                                        <Mail size={12} /> {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{emp.role}</td>
                                        <td className="px-6 py-4">{emp.department}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${emp.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {emp.account_status || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No employees found. Check Google Sheets.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Ensure AlertCircle is imported for the Access Denied view
import { AlertCircle } from "lucide-react";
