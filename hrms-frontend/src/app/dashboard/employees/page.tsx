"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Users, Mail, Plus, AlertCircle, User, X, Loader2, Phone, Briefcase, Calendar as CalendarIcon, Shield, DollarSign } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { isHRAdmin, isSuperAdmin, isManager } from "@/lib/roles";

export default function EmployeesPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const activeEmployees = (employees || []).filter(emp => emp && typeof emp === 'object');

    const [apiError, setApiError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: 'Development',
        role: 'Employee' as any,
        salary: '',
        employee_type: 'full_time',
        account_status: 'active',
        contract_end_date: '',
        manager_id: '',
        joining_date: new Date().toISOString().split('T')[0],
        password: ''
    });

    const loadEmployees = async () => {
        if (!user) return;
        setLoading(true);
        setApiError(null);
        try {
            // Must not send params to /employee for a full GET, as params cause it to act differently
            const data = await appsScriptFetch("/employee");
            
            if (data && (Array.isArray(data) || data.employees)) {
                const employeesList = Array.isArray(data) ? data : (data.employees || []);
                setEmployees(employeesList);
            } else {
                setEmployees([]);
                setApiError("Backend returned success but no employee records or invalid format.");
            }
        } catch (error: any) {
            console.error("Failed to load employees", error);
            setApiError(error.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && (isSuperAdmin(user) || isHRAdmin(user))) {
            loadEmployees();
        } else if (user) {
            setLoading(false);
        }
    }, [user]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            await appsScriptFetch("/employee-add", formData);
            setMessage({ type: 'success', text: 'Employee added successfully!' });
            setIsAddModalOpen(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                department: 'Development',
                role: 'Employee' as any,
                salary: '',
                employee_type: 'full_time',
                account_status: 'active',
                contract_end_date: '',
                manager_id: '',
                joining_date: new Date().toISOString().split('T')[0],
                password: ''
            });
            loadEmployees();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to add employee' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (emp: any) => {
        setEditingEmployee(emp);
        setFormData({
            name: emp.name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || 'Development',
            role: emp.role || 'Employee',
            salary: emp.salary || '',
            employee_type: emp.employee_type || 'full_time',
            account_status: emp.account_status || 'active',
            contract_end_date: emp.contract_end_date || '',
            manager_id: emp.manager_id || '',
            joining_date: emp.joining_date || '',
            password: '' 
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const updates: any = { ...formData, employee_id: editingEmployee.employee_id };
            if (!formData.password) delete updates.password;

            await appsScriptFetch("/employee-update", updates);
            
            if (formData.password) {
                await appsScriptFetch("/update-password", {
                    employee_id: editingEmployee.employee_id,
                    new_password: formData.password,
                    is_admin_reset: true
                });
            }

            setMessage({ type: 'success', text: 'Employee updated successfully!' });
            setIsEditModalOpen(false);
            loadEmployees();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update employee' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isSuperAdmin(user) && !isHRAdmin(user)) {
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
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg">
                        <Users size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Employee Directory</h1>
                        <p className="text-xs text-slate-500 font-medium">Manage and view your organization's team members</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition shadow-sm active:scale-95"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Add Employee
                </button>
            </div>

            {apiError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 animate-in fade-in">
                    <AlertCircle size={18} className="text-rose-600" />
                    <span className="text-sm font-bold text-rose-700">{apiError}</span>
                </div>
            )}

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                    <AlertCircle size={18} />
                    <span className="font-bold text-sm tracking-tight">{message.text}</span>
                </div>
            )}

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
                                {activeEmployees.map((emp) => (
                                    <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-slate-900 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8 flex-shrink-0">
                                                    {emp.profile_picture ? (
                                                        <img 
                                                            src={getImageUrl(emp.profile_picture)} 
                                                            alt="" 
                                                            className="absolute inset-0 w-8 h-8 rounded-full object-cover ring-1 ring-slate-100 shadow-sm z-10 transition-opacity duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.opacity = '0';
                                                            }}
                                                            onLoad={(e) => {
                                                                (e.target as HTMLImageElement).style.opacity = '1';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100">
                                                        <User size={14} strokeWidth={2.5} />
                                                    </div>
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
                                            <button 
                                                onClick={() => handleEditClick(emp)}
                                                className="text-sm text-violet-600 hover:text-violet-800 font-bold transition-all active:scale-95 px-3 py-1 bg-violet-50 rounded-lg"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(activeEmployees.length === 0 && !loading) && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                                            No employee records found. Please ensure the Google Sheet is populated correctly.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsAddModalOpen(false)}></div>
                    
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 bg-white">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Employee</h2>
                                <p className="text-xs text-slate-500 font-medium">Register a new team member to the system</p>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="overflow-y-auto flex-1 p-8 space-y-8 custom-scrollbar">
                            <form id="add-employee-form" onSubmit={handleAddSubmit} className="space-y-8">
                                {/* Section 1: Basic Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-violet-600 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-violet-600 rounded-full"></div>
                                        Basic Information
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                                            <div className="relative group">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <User size={16} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-600 transition-all font-medium text-slate-900 text-sm"
                                                    placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                                                    <Mail size={18} />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    required
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                    placeholder="john@agency.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                                                    <Phone size={18} />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                    placeholder="+91 00000 00000"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Joining Date</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <CalendarIcon size={18} />
                                                </div>
                                                <input 
                                                    type="date" 
                                                    required
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                    value={formData.joining_date}
                                                    onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Professional Details */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-violet-600 rounded-full"></div>
                                        Professional Details
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Shield size={18} />
                                                </div>
                                                <select 
                                                    required
                                                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                                >
                                                    <option value="Development">Development</option>
                                                    <option value="Design">Design</option>
                                                    <option value="Marketing">Marketing</option>
                                                    <option value="HR">Human Resources</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Operations">Operations</option>
                                                    <option value="GRAPHICS">Graphics</option>
                                                    <option value="DME">DME</option>
                                                    <option value="VIDEO EDITOR">Video Editor</option>
                                                    <option value="WEBSITE DEVE">Website Development</option>
                                                    <option value="ACCOUNTS">Accounts</option>
                                                    <option value="CEO">CEO</option>
                                                    <option value="COO">COO</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role / Position</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Briefcase size={18} />
                                                </div>
                                                <select 
                                                    required
                                                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                >
                                                    <option value="Employee">Employee</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="HR Admin">HR Admin</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Super Admin">Super Admin</option>
                                                    <option value="CEO">CEO</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Salary (Monthly)</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <DollarSign size={18} />
                                                </div>
                                                <input 
                                                    type="number" 
                                                    required
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                    placeholder="0"
                                                    value={formData.salary}
                                                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reporting Manager</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <Users size={18} />
                                                </div>
                                                <select 
                                                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                    value={formData.manager_id}
                                                    onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                                                >
                                                    <option value="">No Manager (Self)</option>
                                                    {employees.filter(e => String(e.employee_id) !== String(editingEmployee?.employee_id) && (isManager(e) || isSuperAdmin(e) || isHRAdmin(e))).map(manager => (
                                                        <option key={manager.employee_id} value={manager.employee_id}>
                                                            {manager.name} ({manager.role})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employee Type</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.employee_type}
                                                onChange={(e) => setFormData({...formData, employee_type: e.target.value})}
                                            >
                                                <option value="full_time">Full Time</option>
                                                <option value="part_time">Part Time</option>
                                                <option value="Intern">Intern</option>
                                                <option value="contract">Contract</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Status</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.account_status}
                                                onChange={(e) => setFormData({...formData, account_status: e.target.value})}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contract End Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.contract_end_date}
                                                onChange={(e) => setFormData({...formData, contract_end_date: e.target.value})}
                                                disabled={formData.employee_type !== 'contract'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Credentials */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-violet-600 rounded-full"></div>
                                        Access Credentials
                                    </h3>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                                                <Shield size={18} />
                                            </div>
                                            <input 
                                                type="password" 
                                                required
                                                minLength={6}
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 ml-1">Min. 6 characters. The employee can change this later.</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 sticky bottom-0">
                            <button 
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 font-semibold text-xs text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                form="add-employee-form"
                                disabled={isSubmitting}
                                className="px-8 py-2.5 bg-violet-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-violet-700 transition-all active:scale-95 flex items-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <span>Register Employee</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsEditModalOpen(false)}></div>
                    
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Profile</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight opacity-70">Updating details for {editingEmployee?.name}</p>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="overflow-y-auto flex-1 p-8 space-y-8 custom-scrollbar">
                            <form id="edit-employee-form" onSubmit={handleUpdateSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-violet-600 rounded-full"></div>
                                        Core Information
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                            <input 
                                                type="email" 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Joining Date</label>
                                            <input 
                                                type="date" 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.joining_date}
                                                onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-violet-600 rounded-full"></div>
                                        Organization Details
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                                            <select 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.department}
                                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                            >
                                                <option value="Development">Development</option>
                                                <option value="Design">Design</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="HR">Human Resources</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Operations">Operations</option>
                                                <option value="GRAPHICS">Graphics</option>
                                                <option value="DME">DME</option>
                                                <option value="VIDEO EDITOR">Video Editor</option>
                                                <option value="WEBSITE DEVE">Website Development</option>
                                                <option value="ACCOUNTS">Accounts</option>
                                                <option value="CEO">CEO</option>
                                                <option value="COO">COO</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role / Position</label>
                                            <select 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.role}
                                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            >
                                                <option value="Employee">Employee</option>
                                                <option value="Manager">Manager</option>
                                                <option value="HR Admin">HR Admin</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Super Admin">Super Admin</option>
                                                <option value="CEO">CEO</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Salary (Monthly)</label>
                                            <input 
                                                type="number" 
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.salary}
                                                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reporting Manager</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.manager_id}
                                                onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                                            >
                                                <option value="">No Manager (Self)</option>
                                                {employees.filter(e => String(e.employee_id) !== String(editingEmployee?.employee_id) && (isManager(e) || isSuperAdmin(e) || isHRAdmin(e))).map(manager => (
                                                    <option key={manager.employee_id} value={manager.employee_id}>
                                                        {manager.name} ({manager.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Employee Type</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.employee_type}
                                                onChange={(e) => setFormData({...formData, employee_type: e.target.value})}
                                            >
                                                <option value="full_time">Full Time</option>
                                                <option value="part_time">Part Time</option>
                                                <option value="Intern">Intern</option>
                                                <option value="contract">Contract</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Status</label>
                                            <select 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900 appearance-none"
                                                value={formData.account_status}
                                                onChange={(e) => setFormData({...formData, account_status: e.target.value})}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contract End Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all font-bold text-slate-900"
                                                value={formData.contract_end_date}
                                                onChange={(e) => setFormData({...formData, contract_end_date: e.target.value})}
                                                disabled={formData.employee_type !== 'contract'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-rose-600 rounded-full"></div>
                                        Security Reset
                                    </h3>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Force New Password (Optional)</label>
                                        <input 
                                            type="password" 
                                            className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-600 transition-all font-bold text-slate-900"
                                            placeholder="Leave empty to keep current"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                        <p className="text-[10px] font-bold text-slate-400 ml-1">Changing this will immediately overwrite the employee's password.</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4 sticky bottom-0">
                            <button 
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-3.5 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                form="edit-employee-form"
                                disabled={isSubmitting}
                                className="px-10 py-3.5 bg-violet-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Applying...</span>
                                    </>
                                ) : (
                                    <span>Sync Changes</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

