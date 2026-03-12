"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { appsScriptFetch } from "@/lib/api";

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const canPost = user?.role === "HR Admin" || user?.role === "Super Admin";

    const loadAnnouncements = async () => {
        try {
            const data = await appsScriptFetch("/get-announcements");
            setAnnouncements(data || []);
        } catch (error) {
            console.error("Failed to load announcements", error);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
        
        // Auto-refresh every 10 seconds to keep announcements synced in "real-time"
        const interval = setInterval(loadAnnouncements, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await appsScriptFetch("/post-announcement", {
                title,
                message: description,
                posted_by: user?.name,
                type: 'HR',
                priority
            });
            setShowSuccess(true);
            setTitle("");
            setDescription("");
            loadAnnouncements();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to post announcement");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canPost) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
                    <Megaphone size={48} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-500 max-w-md">You do not have permission to view or manage announcements. Only HR and Super Admins can access this page.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">Manage Announcements</h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-[9px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-100">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
                        Real-time Sync
                    </div>
                </div>
                <p className="text-sm text-slate-500">Create new announcements to broadcast to all employees.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Plus size={20} className="text-indigo-600" />
                        Create New Announcement
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {showSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 size={20} className="text-emerald-600" />
                            <p className="font-medium text-sm">Announcement posted successfully! It will now appear on all employee dashboards.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                                    Announcement Title
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Quarterly Townhall Meeting"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                                    Priority Level
                                </label>
                                <select
                                    id="priority"
                                    value={priority}
                                    onChange={(e: any) => setPriority(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white font-medium"
                                >
                                    <option value="normal">🟢 Normal</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                                Message Details
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write your announcement message here..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isSubmitting || !title || !description}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? "Posting..." : "Post Announcement"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Past Announcements</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {loadingAnnouncements ? (
                        <div className="p-10 text-center animate-pulse text-slate-400">Loading...</div>
                    ) : announcements.length > 0 ? (
                        announcements.map((ann: any) => (
                            <div key={ann.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-900">{ann.title}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${
                                            ann.priority === 'urgent' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                            ann.priority === 'high' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                                            'bg-slate-50 text-slate-500 ring-slate-100'
                                        }`}>
                                            {ann.priority || 'normal'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{new Date(ann.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-600">{ann.message}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">Posted by {ann.posted_by}</p>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-400 text-sm">
                            No past announcements found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
