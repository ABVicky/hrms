"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { appsScriptFetch } from "@/lib/api";

type Role = "Super Admin" | "HR Admin" | "Finance" | "Manager" | "Employee";

export interface User {
    employee_id: string;
    name: string;
    email: string;
    role: Role;
    department: string;
    manager_id?: string;
    employee_type: string;
    profile_picture?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    attendanceStatus: 'checked-in' | 'checked-out' | 'none';
    refreshAttendanceStatus: () => Promise<void>;
    performAttendanceAction: (action: 'checkin' | 'checkout', mode?: 'office' | 'wfh') => Promise<any>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState<'checked-in' | 'checked-out' | 'none'>('none');
    const router = useRouter();

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem("hrms_user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Fetch status immediately after setting user
            fetchInitialStatus(parsedUser.employee_id);
        }
        setLoading(false);
    }, []);

    const fetchInitialStatus = async (employee_id: string) => {
        try {
            const data = await appsScriptFetch("/latest-status", { employee_id });
            if (data && data.status) {
                setAttendanceStatus(data.status);
            } else {
                setAttendanceStatus('none');
            }
        } catch (err) {
            console.error("Failed to fetch initial attendance status", err);
            setAttendanceStatus('none');
        }
    };

    const refreshAttendanceStatus = async () => {
        if (!user) return;
        await fetchInitialStatus(user.employee_id);
    };

    const performAttendanceAction = async (action: 'checkin' | 'checkout', checkinMode: 'office' | 'wfh' = 'wfh') => {
        if (!user) return;
        
        // Optimistic UI Update
        const previousStatus = attendanceStatus;
        setAttendanceStatus(action === 'checkin' ? 'checked-in' : 'checked-out');

        try {
            const endpoint = action === 'checkin' ? '/checkin' : '/checkout';
            const res = await appsScriptFetch(endpoint, {
                employee_id: user.employee_id,
                mode: checkinMode
            });
            // Re-fetch to ensure sync with server but don't clear the optimistic state if not needed
            await refreshAttendanceStatus();
            return res;
        } catch (err) {
            // Rollback on error
            setAttendanceStatus(previousStatus);
            console.error("Attendance action failed", err);
            throw err;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const data = await appsScriptFetch("/login", { email, password });
            if (data && data.user) {
                setUser(data.user);
                localStorage.setItem("hrms_user", JSON.stringify(data.user));
                router.push("/dashboard");
            }
        } catch (error) {
            setLoading(false);
            throw error;
        }
        setLoading(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("hrms_user");
        router.push("/login");
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updated = { ...user, ...updates };
            setUser(updated);
            localStorage.setItem("hrms_user", JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            logout, 
            updateUser, 
            attendanceStatus,
            refreshAttendanceStatus,
            performAttendanceAction,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
