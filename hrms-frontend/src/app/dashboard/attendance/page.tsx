"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { appsScriptFetch } from "@/lib/api";
import { MapPin, Clock, Home, AlertCircle, Loader2, Power, Camera, X, CheckCircle2, Crosshair, BarChart2 } from "lucide-react";
import ActiveTimer from "@/components/ActiveTimer";
import { playAttendanceSound } from "@/lib/utils";
import Link from "next/link";

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

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        loadAttendance();
    }, [user]);

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

    // ─── Camera helpers ──────────────────────────────────────────────────────

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

    // Draw employee name overlay on canvas and return base64
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Mirror effect (selfie-style)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        // Bottom overlay bar
        const barH = 72;
        const grd = ctx.createLinearGradient(0, canvas.height - barH, 0, canvas.height);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.75)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        // Employee name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText(user?.name || 'Employee', 16, canvas.height - 36);

        // Timestamp
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '13px Inter, sans-serif';
        const ts = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        ctx.fillText(ts, 16, canvas.height - 14);

        // Employee ID badge top-right
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

    // ─── Location helpers ─────────────────────────────────────────────────────

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
                // Auto-advance to camera after short delay
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

    // ─── Main action handler ──────────────────────────────────────────────────

    const handleToggle = () => {
        if (isActiveSession) {
            handleCheckout();
        } else if (mode === 'wfh') {
            // Open WFH modal flow
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
            // Convert dataURL to mime + base64
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

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4 md:space-y-8 max-w-5xl mx-auto page-transition pb-10">

            {/* WFH Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

                        {/* Header */}
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

                        {/* Step 1: Location */}
                        {cameraStep === 'location' && (
                            <div className="p-6 text-center space-y-5">
                                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    locationStatus === 'ok' ? 'bg-emerald-100' :
                                    locationStatus === 'error' ? 'bg-rose-100' :
                                    locationStatus === 'loading' ? 'bg-indigo-100 animate-pulse' :
                                    'bg-slate-100'
                                }`}>
                                    {locationStatus === 'ok' ? <CheckCircle2 size={40} className="text-emerald-500" /> :
                                     locationStatus === 'loading' ? <Loader2 size={40} className="text-indigo-500 animate-spin" /> :
                                     <Crosshair size={40} className={locationStatus === 'error' ? 'text-rose-500' : 'text-slate-400'} />}
                                </div>

                                <div>
                                    <p className="font-bold text-slate-900 text-base">Location Permission Required</p>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        Your live location is mandatory for WFH check-in verification. It will be recorded in the attendance sheet.
                                    </p>
                                </div>

                                {wfhLocation && (
                                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-bold">
                                        <MapPin size={14} />
                                        {wfhLocation.lat.toFixed(5)}°, {wfhLocation.lng.toFixed(5)}°
                                    </div>
                                )}

                                {locationStatus !== 'ok' && (
                                    <button
                                        onClick={requestWfhLocation}
                                        disabled={locationStatus === 'loading'}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {locationStatus === 'loading' ? <><Loader2 size={18} className="animate-spin" /> Getting location...</> : <><Crosshair size={18} /> Allow Location</>}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 2: Live Camera */}
                        {cameraStep === 'camera' && (
                            <div className="space-y-0">
                                <div className="relative bg-black aspect-[4/3] overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                    {!cameraReady && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                            <Loader2 size={32} className="text-white animate-spin" />
                                        </div>
                                    )}
                                    {/* Viewfinder corners */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                                    </div>
                                    {/* Name preview */}
                                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
                                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                        <p className="text-white font-bold text-sm">{user?.name}</p>
                                        <p className="text-white/70 text-xs">{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <button
                                        onClick={capturePhoto}
                                        disabled={!cameraReady}
                                        className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Camera size={20} /> Take Selfie
                                    </button>
                                </div>
                                {/* Hidden canvas for drawing */}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {cameraStep === 'confirm' && capturedImage && (
                            <div className="space-y-0">
                                <div className="relative">
                                    <img src={capturedImage} alt="Selfie preview" className="w-full aspect-[4/3] object-cover" />
                                    <div className="absolute top-3 right-3">
                                        <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                            📸 Selfie Captured
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <p className="text-sm text-slate-500 text-center font-medium">
                                        Your selfie with name &amp; timestamp will be saved to Drive.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { setCapturedImage(null); setCameraStep('camera'); startCamera(); }}
                                            className="py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                                        >
                                            Retake
                                        </button>
                                        <button
                                            onClick={handleWfhCheckin}
                                            className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                    <p className="text-slate-500 font-medium">Manage your daily work session.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/attendance/analytics"
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-bold text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                        <BarChart2 size={16} />
                        Analytics
                    </Link>
                    <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 w-fit">
                        <div className={`w-2 h-2 rounded-full ${isActiveSession ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <p className="text-sm font-bold text-slate-700">{new Date().toDateString()}</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 md:p-5 rounded-2xl shadow-lg shadow-black/5 animate-in slide-in-from-top-4 duration-300 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className={message.type === 'error' ? 'text-rose-500' : 'text-emerald-500'} />
                        <span className="font-bold text-sm md:text-base">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Central Toggle Control */}
            <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 premium-card text-center">
                <div className="max-w-md mx-auto space-y-10">
                    {/* Mode Selector */}
                    {!isActiveSession && !todayRecord?.check_out && (
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl items-center relative z-0">
                            <button
                                onClick={() => setMode('office')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'office' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MapPin size={16} /> Office
                            </button>
                            <button
                                onClick={() => setMode('wfh')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'wfh' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Home size={16} /> WFH
                            </button>
                        </div>
                    )}

                    {/* Mode hints */}
                    {!isActiveSession && !todayRecord?.check_out && mode === 'wfh' && (
                        <div className="-mt-5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl w-fit mx-auto bg-cyan-50 text-cyan-600 border border-cyan-100">
                            📸 Location + Selfie required
                        </div>
                    )}

                    {/* Main Button */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-8">
                            {isActiveSession && (
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150 opacity-20"></div>
                            )}
                            <button
                                onClick={handleToggle}
                                disabled={loading || (!!todayRecord?.check_in && !!todayRecord?.check_out)}
                                className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 border-8 ${isActiveSession
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-100 shadow-amber-200'
                                    : !!todayRecord?.check_out
                                        ? 'bg-slate-100 text-slate-400 border-slate-50 shadow-none'
                                        : mode === 'wfh'
                                            ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-100 shadow-cyan-200'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-100 shadow-emerald-200'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin w-10 h-10" />
                                ) : (
                                    <>
                                        {isActiveSession ? <Power size={48} strokeWidth={2.5} className="mb-2" /> :
                                         !!todayRecord?.check_out ? <Power size={48} strokeWidth={2.5} className="mb-2" /> :
                                         mode === 'wfh' ? <Camera size={40} strokeWidth={2.5} className="mb-2" /> :
                                         <Power size={48} strokeWidth={2.5} className="mb-2" />}
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {isActiveSession ? 'Check Out' : !!todayRecord?.check_out ? 'Session Over' : mode === 'wfh' ? 'WFH Check In' : 'Check In'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {isActiveSession ? (
                                <ActiveTimer checkInTime={todayRecord.check_in} />
                            ) : (
                                <h2 className="text-4xl font-black tracking-tighter tabular-nums text-slate-300">
                                    00:00:00
                                </h2>
                            )}
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active session duration</p>
                        </div>
                    </div>

                    {/* Status Details */}
                    {todayRecord?.check_in && (
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                            <div className="text-left space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checked In At</p>
                                <p className="font-bold text-slate-900">
                                    {(() => {
                                        if (!todayRecord?.check_in) return "—";
                                        const d = new Date(todayRecord.check_in);
                                        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    })()}
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mode</p>
                                <p className="font-bold text-slate-900 flex items-center justify-end gap-1.5 capitalize">
                                    {todayRecord.mode === 'office' ? <MapPin size={14} className="text-indigo-500" /> : <Home size={14} className="text-cyan-500" />}
                                    {todayRecord.mode}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* WFH Location + Selfie row */}
                    {todayRecord?.mode === 'wfh' && todayRecord?.latitude && todayRecord?.longitude && (
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <a
                                href={`https://maps.google.com/?q=${todayRecord.latitude},${todayRecord.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-cyan-600 font-bold text-sm hover:text-cyan-700 transition-colors justify-center"
                            >
                                <MapPin size={13} />
                                {parseFloat(todayRecord.latitude).toFixed(5)}°, {parseFloat(todayRecord.longitude).toFixed(5)}°
                                <span className="text-[9px] uppercase tracking-widest font-black text-cyan-400 ml-1">View Map ↗</span>
                            </a>
                            {todayRecord?.selfie_url && (
                                <a href={todayRecord.selfie_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                                    <Camera size={13} /> View WFH Selfie ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden premium-card">
                <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Recent History</h2>
                    <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ring-1 ring-slate-100 shadow-sm">Past 30 Days</div>
                </div>

                {/* Mobile History */}
                <div className="md:hidden divide-y divide-slate-50">
                    {attendanceRecords.length > 0 ? (
                        attendanceRecords.slice().reverse().map((record: any) => {
                            const dateObj = new Date(record.date);
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                            const safeLocalTime = (iso: string) => {
                                if (!iso || iso === "---" || String(iso).trim() === "") return "—";
                                const d = new Date(iso);
                                return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            };
                            return (
                                <div key={record.attendance_id} className="p-6 space-y-5 active:bg-slate-50 transition-colors group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-900 text-lg leading-none tracking-tight">{record.date}</p>
                                                <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${record.mode === 'office' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-cyan-50 border-cyan-100 text-cyan-600'}`}>
                                                    {record.mode}
                                                </div>
                                                {record.selfie_url && (
                                                    <a href={record.selfie_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-1 bg-slate-100 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                        <Camera size={11} />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{dayName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{record.working_hours || '0.00'}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Hours</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-100"></div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check In</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 tabular-nums">{safeLocalTime(record.check_in)}</p>
                                        </div>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check Out</p>
                                                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 text-right tabular-nums">{safeLocalTime(record.check_out)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-10 text-center text-slate-400 font-medium">No records found.</div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/30 text-slate-400 font-bold uppercase tracking-[0.15em] text-[11px]">
                            <tr>
                                <th className="px-10 py-6">Timeline</th>
                                <th className="px-10 py-6">Mode</th>
                                <th className="px-10 py-6">Check In</th>
                                <th className="px-10 py-6">Check Out</th>
                                <th className="px-10 py-6">Selfie</th>
                                <th className="px-10 py-6 text-right">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendanceRecords.slice().reverse().map((record: any) => {
                                const dateObj = new Date(record.date);
                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                                const safeLocalTime = (iso: string) => {
                                    if (!iso || iso === "---" || String(iso).trim() === "") return "—";
                                    const d = new Date(iso);
                                    return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                                };
                                return (
                                    <tr key={record.attendance_id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                        <td className="px-10 py-8">
                                            <div className="space-y-0.5">
                                                <p className="font-black text-slate-900 text-lg tracking-tight">{record.date}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest">{dayName}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider ${
                                                record.mode === 'office'
                                                ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600'
                                                : 'bg-cyan-50/50 border-cyan-100 text-cyan-600'
                                            }`}>
                                                {record.mode === 'office' ? <MapPin size={12} strokeWidth={3} /> : <Home size={12} strokeWidth={3} />}
                                                {record.mode}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 font-bold text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                {safeLocalTime(record.check_in)}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 font-bold text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                                {safeLocalTime(record.check_out)}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {record.selfie_url ? (
                                                <a href={record.selfie_url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-xl text-[11px] font-black hover:bg-cyan-600 hover:text-white transition-all">
                                                    <Camera size={12} /> View
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-[11px] font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="font-black text-slate-900 text-xl tracking-tight">{record.working_hours || '0.00'}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
