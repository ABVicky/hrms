"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { MapPin, Clock, Home, AlertCircle, Loader2, Power, Camera, X, CheckCircle2, Crosshair, BarChart2 } from "lucide-react";
import ActiveTimer from "@/components/ActiveTimer";
import { playAttendanceSound } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Office geo-fence
const OFFICE_COORDS = { lat: 22.596755385565324, lng: 88.39958873340666 };
const MAX_DISTANCE_METERS = 100;

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function AttendancePage() {
    const { user, performAttendanceAction } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [mode, setMode] = useState<'office' | 'wfh'>('office');

    // WFH Camera state
    const [showCamera, setShowCamera] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraStep, setCameraStep] = useState<'location' | 'camera' | 'confirm'>('location');
    const [wfhLocation, setWfhLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (user?.role === "Super Admin") {
            router.replace("/dashboard/attendance/analytics");
        }
        loadAttendance();
    }, [user, router]);

    // Stop camera when modal closes
    useEffect(() => {
        if (!showCamera) {
            stopCamera();
            setCapturedImage(null);
            setCameraReady(false);
            setCameraStep('location');
            setWfhLocation(null);
            setLocationStatus('idle');
        }
    }, [showCamera]);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const openSession = (attendanceRecords || [])
        .filter(a => a && a.check_in && !a.check_out && !isNaN(new Date(a.check_in).getTime()))
        .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())[0];

    const todayRecord = openSession || (attendanceRecords || [])
        .filter(a => a && String(a.date) === todayStr)
        .sort((a, b) => {
            const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
            const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        })[0];

    const isActiveSession = !!openSession;

    async function loadAttendance() {
        try {
            const data = await appsScriptFetch("/attendance", { employee_id: user?.employee_id });
            setAttendanceRecords(data || []);
        } catch (error) {
            console.error("Load attendance failed", error);
        }
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setCameraReady(true);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Camera access denied. Camera is required for WFH check-in.' });
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    };

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const barH = 72;
        const grd = ctx.createLinearGradient(0, canvas.height - barH, 0, canvas.height);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.75)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText(user?.name || 'Employee', 16, canvas.height - 36);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '13px Inter, sans-serif';
        const ts = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        ctx.fillText(ts, 16, canvas.height - 14);

        ctx.fillStyle = 'rgba(79,70,229,0.85)';
        const idText = `ID: ${user?.employee_id}`;
        const textW = ctx.measureText(idText).width;
        const badgeX = canvas.width - textW - 24;
        ctx.roundRect(badgeX - 8, 12, textW + 16, 28, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(idText, badgeX, 31);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(dataUrl);
        setCameraStep('confirm');
        stopCamera();
    }, [user]);

    const requestWfhLocation = () => {
        setLocationStatus('loading');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setWfhLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationStatus('ok');
                setTimeout(() => {
                    setCameraStep('camera');
                    startCamera();
                }, 600);
            },
            (err) => {
                setLocationStatus('error');
                setMessage({ type: 'error', text: 'Location permission is required for WFH check-in. Please allow access and try again.' });
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const handleToggle = () => {
        if (isActiveSession) {
            setShowCheckoutConfirm(true);
        } else if (mode === 'wfh') {
            setShowCamera(true);
        } else {
            handleOfficeCheckin();
        }
    };

    const handleOfficeCheckin = () => {
        setLoading(true);
        setMessage(null);
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const distance = getDistanceFromLatLonInM(
                    position.coords.latitude,
                    position.coords.longitude,
                    OFFICE_COORDS.lat,
                    OFFICE_COORDS.lng
                );

                if (distance > MAX_DISTANCE_METERS) {
                    setMessage({ type: 'error', text: `You are too far from the office (${Math.round(distance)}m away. Max allowed: ${MAX_DISTANCE_METERS}m)` });
                    setLoading(false);
                    return;
                }

                try {
                    const res = await performAttendanceAction('checkin', 'office', position.coords.latitude, position.coords.longitude);
                    if (!res) throw new Error("No response from server");
                    playAttendanceSound('checkin');
                    setMessage({ type: 'success', text: res.status || 'Checked in successfully!' });
                    setTimeout(() => setMessage(null), 5000);
                    await loadAttendance();
                } catch (err: any) {
                    setMessage({ type: 'error', text: err.message });
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setMessage({ type: 'error', text: 'Location error: ' + err.message });
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleWfhCheckin = async () => {
        if (!capturedImage || !wfhLocation) return;
        setLoading(true);
        setShowCamera(false);
        setMessage(null);
        try {
            const mime = capturedImage.split(';')[0].split(':')[1];
            const filename = `wfh_${user?.employee_id}_${Date.now()}.jpg`;
            const res = await performAttendanceAction(
                'checkin', 'wfh',
                wfhLocation.lat, wfhLocation.lng,
                capturedImage, mime, filename
            );
            if (!res) throw new Error("No response from server");
            playAttendanceSound('checkin');
            setMessage({ type: 'success', text: res.status || 'WFH Check-in successful! Selfie saved.' });
            setTimeout(() => setMessage(null), 6000);
            await loadAttendance();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        setShowCheckoutConfirm(false);
        setLoading(true);
        setMessage(null);
        try {
            const res = await performAttendanceAction('checkout', todayRecord?.mode);
            if (!res) throw new Error("No response from server");
            playAttendanceSound('checkout');
            setMessage({ type: 'success', text: res.status || 'Checked out successfully!' });
            setTimeout(() => setMessage(null), 5000);
            await loadAttendance();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* WFH Camera Modal - FIXED VIEWPORT POSITION */}
            {showCamera && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <p className="font-black text-slate-900 text-base">WFH Check-In</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {cameraStep === 'location' ? 'Step 1 of 2 — Location' :
                                     cameraStep === 'camera' ? 'Step 2 of 2 — Selfie' :
                                     'Confirm & Submit'}
                                </p>
                            </div>
                            <button onClick={() => setShowCamera(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        {cameraStep === 'location' && (
                            <div className="p-6 text-center space-y-5">
                                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    locationStatus === 'ok' ? 'bg-emerald-100' :
                                    locationStatus === 'error' ? 'bg-rose-100' :
                                    locationStatus === 'loading' ? 'bg-rose-100 animate-pulse' :
                                    'bg-slate-100'
                                }`}>
                                    {locationStatus === 'ok' ? <CheckCircle2 size={40} className="text-emerald-500" /> :
                                     locationStatus === 'loading' ? <Loader2 size={40} className="text-rose-500 animate-spin" /> :
                                     <Crosshair size={40} className={locationStatus === 'error' ? 'text-rose-500' : 'text-slate-400'} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-900 text-base">Location Required</p>
                                    <p className="text-sm text-slate-500 leading-relaxed px-4">Your live location is mandatory for WFH check-in verification.</p>
                                </div>
                                {locationStatus !== 'ok' && (
                                    <button onClick={requestWfhLocation} disabled={locationStatus === 'loading'}
                                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {locationStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />} Allow Location
                                    </button>
                                )}
                            </div>
                        )}
                        {cameraStep === 'camera' && (
                            <div className="space-y-0 text-center">
                                <div className="relative bg-black aspect-[4/3] overflow-hidden">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                    {!cameraReady && <div className="absolute inset-0 flex items-center justify-center bg-slate-900"><Loader2 size={32} className="text-white animate-spin" /></div>}
                                </div>
                                <div className="p-4">
                                    <button onClick={capturePhoto} disabled={!cameraReady} className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Camera size={20} /> Take Selfie
                                    </button>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                        {cameraStep === 'confirm' && capturedImage && (
                            <div className="space-y-0">
                                <img src={capturedImage} alt="Selfie preview" className="w-full aspect-[4/3] object-cover" />
                                <div className="p-4 grid grid-cols-2 gap-3">
                                    <button onClick={() => { setCapturedImage(null); setCameraStep('camera'); startCamera(); }} className="py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all">Retake</button>
                                    <button onClick={handleWfhCheckin} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all">Confirm</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Confirmation Modal - FIXED VIEWPORT POSITION */}
            {showCheckoutConfirm && (
                <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center"><Power size={40} className="text-amber-600" /></div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Finish Session?</h3>
                            <p className="text-sm text-slate-500 font-medium">Are you sure you want to check out? This will end your active working session.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={() => setShowCheckoutConfirm(false)} className="py-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={handleCheckout} className="py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-amber-200">Yes, End</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Page - page-transition div is SEPARATE from modals */}
            <div className="space-y-4 md:space-y-8 max-w-5xl mx-auto page-transition pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                        <p className="text-slate-500 font-medium">Manage your daily work session.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/attendance/analytics" className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                            <BarChart2 size={16} /> Analytics
                        </Link>
                        <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isActiveSession ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <p className="text-sm font-bold text-slate-700">{new Date().toDateString()}</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 md:p-5 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} className={message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'} />
                            <span className="font-bold text-sm md:text-base">{message.text}</span>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 premium-card text-center">
                    <div className="max-w-md mx-auto space-y-10">
                        {!isActiveSession && !todayRecord?.check_out && (
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl items-center relative z-0">
                                <button onClick={() => setMode('office')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'office' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}><MapPin size={16} /> Office</button>
                                <button onClick={() => setMode('wfh')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'wfh' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}><Home size={16} /> WFH</button>
                            </div>
                        )}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-8">
                                {isActiveSession && <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150 opacity-20"></div>}
                                <button onClick={handleToggle} disabled={loading || (!!todayRecord?.check_in && !!todayRecord?.check_out)}
                                    className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 border-8 ${isActiveSession ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-100 shadow-amber-200' : !!todayRecord?.check_out ? 'bg-slate-100 text-slate-400 border-slate-50' : mode === 'wfh' ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-100 shadow-cyan-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-100 shadow-emerald-200'}`}>
                                    {loading ? <Loader2 className="animate-spin w-10 h-10" /> : (
                                        <>
                                            {isActiveSession ? <Power size={48} strokeWidth={2.5} className="mb-2" /> : !!todayRecord?.check_out ? <Power size={48} strokeWidth={2.5} className="mb-2" /> : mode === 'wfh' ? <Camera size={40} className="mb-2" /> : <Power size={48} className="mb-2" />}
                                            <span className="text-xs font-black uppercase tracking-widest">{isActiveSession ? 'Check Out' : !!todayRecord?.check_out ? 'Session Over' : mode === 'wfh' ? 'WFH Check In' : 'Check In'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {isActiveSession ? <ActiveTimer checkInTime={todayRecord.check_in} /> : <h2 className="text-4xl font-black tracking-tighter tabular-nums text-slate-300">00:00:00</h2>}
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                            </div>
                        </div>
                        {todayRecord?.check_in && (
                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100 text-sm">
                                <div className="text-left"><p className="text-[10px] font-black uppercase text-slate-400">In At</p><p className="font-bold text-slate-900">{new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400">Mode</p><p className="font-bold text-slate-900 capitalize">{todayRecord.mode}</p></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                    <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900 tracking-tight">Recent History</h2></div>
                    {/* Desktop View Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                <tr className="border-b border-slate-50">
                                    <th className="px-10 py-6">Date</th>
                                    <th className="px-10 py-6">Mode</th>
                                    <th className="px-10 py-6">In</th>
                                    <th className="px-10 py-6">Out</th>
                                    <th className="px-10 py-6 text-right">Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {attendanceRecords.slice().reverse().map((record: any) => (
                                    <tr key={record.attendance_id} className="hover:bg-slate-50/50 transition-all font-medium text-slate-600 group">
                                        <td className="px-10 py-6 font-bold text-slate-900">{record.date}</td>
                                        <td className="px-10 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${record.mode === 'office' ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-600'}`}>
                                                {record.mode}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">{record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                        <td className="px-10 py-6">{record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                        <td className="px-10 py-6 text-slate-900 font-black text-right">{record.working_hours || '0.00'}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-50">
                        {attendanceRecords.slice().reverse().map((record: any) => (
                            <div key={record.attendance_id} className="p-5 space-y-4 active:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-slate-900">{record.date}</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${record.mode === 'office' ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-600'}`}>
                                        {record.mode}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 p-2.5 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">In</p>
                                        <p className="text-xs font-bold text-slate-900">{record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Out</p>
                                        <p className="text-xs font-bold text-slate-900">{record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                    </div>
                                    <div className="bg-rose-50 p-2.5 rounded-2xl">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Work</p>
                                        <p className="text-xs font-black text-rose-600">{record.working_hours || '0.00'}h</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
