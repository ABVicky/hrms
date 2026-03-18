"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Settings, LogOut, Upload, AlertCircle, Loader2, Info, User, Bell } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export default function SettingsPage() {
    const { user, logout, updateUser, attendanceStatus } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [backendInfo, setBackendInfo] = useState<{ version: string, url: string } | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const checkBackendVersion = async () => {
            try {
                const res = await appsScriptFetch("/status", {});
                setBackendInfo({ 
                    version: res?.version || "unknown", 
                    url: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "MISSING"
                });
            } catch (err) {
                setBackendInfo({ version: "outdated", url: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "MISSING" });
            }
        };
        checkBackendVersion();
    }, []);

    const compressImage = (file: File): Promise<{ base64: string; mime: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                    resolve({ base64: dataUrl, mime: "image/jpeg" });
                };
            };
            reader.onerror = reject;
        });
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image file must be less than 5MB' });
            return;
        }

        setUploading(true);
        setMessage(null);
        try {
            const compressed = await compressImage(file);
            const res = await appsScriptFetch('/update-profile', {
                employee_id: user?.employee_id,
                avatar_base64: compressed.base64,
                avatar_mime: compressed.mime,
                avatar_filename: `profile_${user?.employee_id}.jpg`
            });
            updateUser({ profile_picture: res.profile_picture });
            setMessage({ type: 'success', text: 'Profile picture updated successfully.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-rose-600 shadow-lg shadow-rose-200 text-white rounded-[1.5rem] transition-transform hover:rotate-12">
                        <Settings size={26} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-sm text-slate-500 font-bold tracking-tight opacity-70 italic">Setup your digital workspace and security</p>
                    </div>
                </div>

                {message && (
                    <div className={`px-5 py-3 rounded-2xl text-sm font-black flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm border md:max-w-xs ${
                        message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                        <div className={`shrink-0 w-2 h-2 rounded-full ${message.type === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <span className="truncate">{message.text}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: IDENTITY SNAPSHOT */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Main Identity Card */}
                    <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-[80px] group-hover:bg-rose-500/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-[2rem] bg-slate-900 flex items-center justify-center border-4 border-slate-900 shadow-2xl overflow-hidden ring-4 ring-slate-800/50">
                                    {user?.profile_picture ? (
                                        <img 
                                            src={getImageUrl(user.profile_picture)} 
                                            alt="" 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <User size={60} className="text-slate-800" strokeWidth={1} />
                                    )}
                                </div>
                                <div className={`absolute -bottom-2 -right-2 w-8 h-8 border-[6px] border-slate-950 rounded-full shadow-lg transition-colors duration-1000 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500 shadow-rose-500/20' : 
                                    'bg-slate-600'
                                }`}></div>
                            </div>

                            <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
                            <p className="text-slate-400 font-bold text-sm mt-1">{user?.email}</p>
                            
                            <div className="mt-8 pt-8 border-t border-slate-900 w-full space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black uppercase tracking-widest text-slate-500 italic">Department</span>
                                    <span className="font-bold text-rose-400 uppercase tracking-tighter">{user?.department}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black uppercase tracking-widest text-slate-500 italic">Position</span>
                                    <span className="font-bold text-white uppercase tracking-tighter">{user?.role}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black uppercase tracking-widest text-slate-500 italic">Employment</span>
                                    <span className="font-bold text-slate-400 uppercase tracking-tighter">{user?.employee_type}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Logout */}
                    <button
                        onClick={logout}
                        className="w-full group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2.2rem] shadow-sm hover:border-rose-100 hover:bg-rose-50/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <LogOut size={20} strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-slate-900 tracking-tight">Logout</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Current Session</p>
                            </div>
                        </div>
                        <div className="text-slate-300 group-hover:translate-x-1 transition-transform">
                            <Settings size={16} />
                        </div>
                    </button>
                </div>

                {/* RIGHT COLUMN: UPDATE CENTER */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Unified Update Dashboard */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-1">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            
                            {/* Profile & Phone Update */}
                            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col">
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
                                        Personal Details
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold mt-1">Manage your contact information</p>
                                </div>

                                {!isEditingProfile ? (
                                    <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="space-y-6">
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Mobile</p>
                                                    <p className="text-slate-900 font-black tracking-tight">{user?.phone || 'Not Registered'}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm border border-slate-100">
                                                    <User size={18} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                                    <Upload size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                    Your profile picture and phone number are visible to HR and Management.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="w-full py-4 tracking-widest font-black text-[10px] uppercase bg-white border-2 border-slate-900 text-slate-900 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-[0.98]"
                                        >
                                            Edit Identity Info
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        {/* Avatar Upload */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Picture</label>
                                            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100/50">
                                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm overflow-hidden flex-shrink-0 border-2 border-white">
                                                    {user?.profile_picture ? (
                                                        <img src={getImageUrl(user.profile_picture)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-full h-full p-3 text-slate-200" />
                                                    )}
                                                </div>
                                                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-black text-xs rounded-xl transition-all cursor-pointer ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white shadow-lg shadow-rose-100 hover:bg-rose-700'}`}>
                                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} strokeWidth={3} />}
                                                    {uploading ? 'Processing...' : 'Upload New'}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} disabled={uploading} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Phone Form */}
                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const phone = formData.get('phone') as string;
                                            try {
                                                const res = await appsScriptFetch('/update-profile', { employee_id: user?.employee_id, phone });
                                                updateUser({ phone: res.phone });
                                                setMessage({ type: 'success', text: 'Contact updated!' });
                                                setIsEditingProfile(false);
                                                setTimeout(() => setMessage(null), 3000);
                                            } catch (err: any) {
                                                setMessage({ type: 'error', text: err.message || 'Update failed' });
                                            }
                                        }} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile Number</label>
                                                <input 
                                                    type="tel" 
                                                    name="phone" 
                                                    defaultValue={user?.phone}
                                                    required 
                                                    placeholder="+91 00000 00000"
                                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white focus:border-rose-600 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingProfile(false)}
                                                    className="py-4 px-6 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="py-4 px-6 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-[0.98] shadow-lg shadow-rose-100"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Security Update */}
                            <div className="p-8 md:p-10 flex flex-col">
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                        Security & Access
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold mt-1">Manage your portal password</p>
                                </div>

                                {!isChangingPassword ? (
                                    <div className="flex-1 flex flex-col justify-between space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="space-y-6">
                                            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-white">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Access Key</p>
                                                    <p className="text-white font-black tracking-[0.3em]">••••••••</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-rose-500 shadow-sm border border-slate-800">
                                                    <Settings size={18} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                    Use a strong, unique password to keep your account secure.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="w-full py-4 tracking-widest font-black text-[10px] uppercase bg-slate-950 text-white rounded-2xl hover:bg-rose-600 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const currentPass = formData.get('current_password') as string;
                                        const newPass = formData.get('new_password') as string;
                                        const confirmPass = formData.get('confirm_password') as string;
                                        if (newPass !== confirmPass) {
                                            setMessage({ type: 'error', text: 'Passwords mismatch!' });
                                            return;
                                        }
                                        try {
                                            await appsScriptFetch('/update-password', { employee_id: user?.employee_id, current_password: currentPass, new_password: newPass });
                                            setMessage({ type: 'success', text: 'Security updated!' });
                                            (e.target as HTMLFormElement).reset();
                                            setIsChangingPassword(false);
                                            setTimeout(() => setMessage(null), 3000);
                                        } catch (err: any) {
                                            setMessage({ type: 'error', text: err.message || 'Security update failed' });
                                        }
                                    }} className="flex-1 space-y-6 animate-in slide-in-from-left-4 duration-500">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Key</label>
                                                <input type="password" name="current_password" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white focus:border-rose-300 transition-all text-sm" placeholder="••••••••" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">New Key</label>
                                                <input type="password" name="new_password" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white focus:border-rose-600 transition-all text-sm" placeholder="••••••••" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verify Key</label>
                                                <input type="password" name="confirm_password" minLength={6} required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white focus:border-rose-600 transition-all text-sm" placeholder="••••••••" />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsChangingPassword(false)}
                                                className="py-4 px-6 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="py-4 px-6 bg-slate-950 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                                            >
                                                Secure Account
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Info Card */}
                    <div className="flex flex-col md:flex-row gap-8 items-stretch">
                        <div className="flex-1 bg-rose-50/50 rounded-[2.5rem] p-8 border border-rose-100/50 relative overflow-hidden">
                            <Info size={120} className="absolute -right-8 -bottom-8 text-rose-100 -rotate-12 opacity-50" />
                            <div className="relative z-10 space-y-4">
                                <h4 className="font-black text-rose-900 tracking-tight flex items-center gap-2">
                                    <Info size={18} strokeWidth={2.5} />
                                    System Diagnostics
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-white">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Version</span>
                                        <span className="text-sm font-black text-rose-600">v{backendInfo?.version || "..."}</span>
                                    </div>
                                    <div className="p-3 bg-white/60 rounded-xl border border-white overflow-hidden">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">API Endpoint</span>
                                        <span className="text-[10px] font-bold text-slate-600 break-all opacity-80">{backendInfo?.url || "UNSET"}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                        
                        <div className="md:w-64 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200/50 flex flex-col justify-center items-center text-center">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4 animate-pulse">
                                <Settings className="text-slate-400" />
                            </div>
                            <h4 className="font-black text-slate-900 text-sm tracking-tight mb-1">Sync Active</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloud Database v2</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
