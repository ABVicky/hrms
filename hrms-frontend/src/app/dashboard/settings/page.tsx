"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { Settings, LogOut, Upload, AlertCircle, Loader2, Info } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export default function SettingsPage() {
    const { user, logout, updateUser, attendanceStatus } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [backendInfo, setBackendInfo] = useState<{ version: string, url: string } | null>(null);

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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 px-1 md:px-0">
                <div className="p-2.5 md:p-3 bg-white shadow-sm ring-1 ring-slate-100 text-indigo-600 rounded-2xl">
                    <Settings size={22} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">Manage your preferences & account</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">Profile Information</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Full Name</p>
                            <p className="text-slate-900 font-medium">{user?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Email Address</p>
                            <p className="text-slate-900 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Role & Department</p>
                            <p className="text-slate-900 font-medium">{user?.role} - {user?.department}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Account Type</p>
                            <p className="text-slate-900 font-medium capitalize">{user?.employee_type}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">Profile Picture</h4>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                <AlertCircle size={16} />
                                {message.text}
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {user?.profile_picture ? (
                                    <img 
                                        src={getImageUrl(user.profile_picture)} 
                                        alt="" 
                                        className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-sm transition-opacity duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0';
                                        }}
                                        onLoad={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '1';
                                        }}
                                    />
                                ) : null}
                                <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-2xl border-4 border-slate-50 absolute inset-0 -z-10">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className={`absolute bottom-0.5 right-0.5 w-5 h-5 border-[4px] border-white rounded-full shadow-sm transition-colors duration-500 ${
                                    attendanceStatus === 'checked-in' ? 'bg-emerald-500' : 
                                    attendanceStatus === 'checked-out' ? 'bg-rose-500' : 
                                    'bg-slate-500'
                                }`}></div>
                            </div>

                            <label className={`flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition border cursor-pointer ${uploading ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {uploading ? 'Uploading...' : 'Change Picture'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">System Status</h3>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${backendInfo?.version === '1.3' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connected</span>
                    </div>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Backend Version</p>
                            <p className="font-black text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 w-fit">v{backendInfo?.version || "..."}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Endpoint</p>
                            <p className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 break-all leading-relaxed">
                                {backendInfo?.url || "NOT CONFIGURED"}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex gap-3">
                        <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                            Diagnostic info for development. If version is "outdated", please update your Google Apps Script.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-8 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Account Actions</h3>
                </div>
                <div className="p-6 md:p-8 space-y-5">
                    <p className="text-sm text-slate-500 font-medium">Sign out of your account to terminate your active session.</p>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-6 py-4 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-rose-200 group clickable"
                    >
                        <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
