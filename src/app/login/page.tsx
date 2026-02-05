"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, ArrowRight, ArrowLeft, Users, ShieldCheck, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [view, setView] = useState<'STAFF' | 'OWNER'>('STAFF');

    // Wrapper to handle login logic
    const handleLoginSubmit = async (username: string, pin: string) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login gagal");
            }

            router.push("/");
            router.refresh();
            return true;
        } catch (err: any) {
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10 glass-card shadow-2xl shadow-indigo-500/10 border-white/50 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
                        <Warehouse className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        UD. Mulyo
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        Warehouse Management System
                    </p>
                </div>

                {/* Role Toggles */}
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl mb-8">
                    <button
                        onClick={() => setView('STAFF')}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                            view === 'STAFF' ? "bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Users size={18} /> Karyawan
                    </button>
                    <button
                        onClick={() => setView('OWNER')}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                            view === 'OWNER' ? "bg-white dark:bg-slate-800 shadow text-orange-600 dark:text-orange-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <ShieldCheck size={18} /> Owner
                    </button>
                </div>

                {view === 'OWNER' ? (
                    <OwnerLoginForm onLogin={handleLoginSubmit} />
                ) : (
                    <StaffLoginGrid onLogin={handleLoginSubmit} />
                )}

                <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
                    <p className="text-xs text-slate-400 dark:text-slate-600">
                        &copy; {new Date().getFullYear()} WMS Indo System v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}

// Owner Form Component
function OwnerLoginForm({ onLogin }: { onLogin: (u: string, p: string) => Promise<boolean> }) {
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await onLogin(username, pin);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-medium flex items-center justify-center gap-2">
                    <Lock size={16} /> {error}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Username Owner</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        className="input-modern w-full pl-11 py-3"
                        placeholder="owner"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">PIN Akses</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="password"
                        placeholder="••••••"
                        maxLength={6}
                        className="input-modern w-full pl-11 py-3 font-mono text-lg tracking-widest"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !username || !pin}
                className="btn-primary w-full py-3.5 shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-orange-500 to-red-600 border-none hover:from-orange-600 hover:to-red-700"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>Masuk sebagai Owner <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}

// Staff Grid Component
function StaffLoginGrid({ onLogin }: { onLogin: (u: string, p: string) => Promise<boolean> }) {
    const [employees, setEmployees] = useState<{ id: number, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmp, setSelectedEmp] = useState<{ id: number, name: string } | null>(null);
    const [pin, setPin] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch('/api/employees')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEmployees(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmp) return;

        setSubmitting(true);
        setError("");
        try {
            await onLogin(selectedEmp.name, pin);
        } catch (err: any) {
            setError("PIN Salah!");
            setSubmitting(false);
            setPin(""); // Clear PIN on error
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (selectedEmp) {
        // PIN Entry Mode for selected staff
        return (
            <form onSubmit={handlePinSubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    type="button"
                    onClick={() => { setSelectedEmp(null); setPin(""); setError(""); }}
                    className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors font-medium"
                >
                    <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar
                </button>

                <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-inner">
                        {selectedEmp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedEmp.name}</h3>
                    <p className="text-sm text-slate-500">Masukkan PIN Staff Anda</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-medium animate-pulse flex items-center justify-center gap-2">
                        <Lock size={16} /> {error}
                    </div>
                )}

                <div className="relative">
                    <input
                        type="password"
                        autoFocus
                        placeholder="••••••"
                        maxLength={6}
                        className="input-modern w-full text-center py-4 text-2xl font-mono tracking-[0.5em]"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting || pin.length < 1}
                    className="btn-primary w-full py-3.5 shadow-lg shadow-blue-500/20"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : "Masuk Sistem"}
                </button>
            </form>
        );
    }

    // Grid selection mode
    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">Pilih akun Anda untuk masuk:</p>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {employees.map(emp => (
                    <button
                        key={emp.id}
                        onClick={() => setSelectedEmp(emp)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 text-sm truncate block mb-1">
                            {emp.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Staff Gudang</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
