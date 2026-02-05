"use client";

import { useState, useEffect } from "react";
import { BarChart3, Calendar, Droplets, Factory, Fuel, AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogItem {
    id: number;
    date: string;
    type: string;
    outputSacks: number;
    solarUsed: number;
    ratio: number;
}

interface SummaryData {
    totalOutputSacks: number;
    totalSolarUsed: number;
    efficiency: number;
    currentSolarStock: number;
    minSolarAlert: boolean;
}

export default function ProductionReportPage({ userRole }: { userRole: string }) {
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0], // First day of month
        endDate: today.toISOString().split('T')[0]
    });

    const [summary, setSummary] = useState<SummaryData>({
        totalOutputSacks: 0,
        totalSolarUsed: 0,
        efficiency: 0,
        currentSolarStock: 0,
        minSolarAlert: false
    });

    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [dateRange]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/production-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            const data = await res.json();

            if (data.summary) setSummary(data.summary);
            if (Array.isArray(data.logs)) setLogs(data.logs);
        } catch (err) {
            console.error("Failed to load report", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus data produksi ini? Stok akan dikembalikan.")) return;

        try {
            const res = await fetch(`/api/daily-log/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Gagal menghapus");
            alert("Data berhasil dihapus.");
            fetchReport();
        } catch (err) {
            alert("Gagal menghapus data.");
        }
    };

    const handlePreset = (type: 'today' | 'week' | 'month') => {
        const end = new Date();
        let start = new Date();

        if (type === 'today') {
            // Start is today
        } else if (type === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'month') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        }

        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" />
                        Laporan Produksi
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Analisa hasil gilingan & efisiensi bahan bakar.</p>
                </div>

                <div className="glass-card p-2 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={() => handlePreset('today')} className="px-3 py-1 text-xs font-medium rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all dark:text-slate-300">Hari Ini</button>
                        <button onClick={() => handlePreset('week')} className="px-3 py-1 text-xs font-medium rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all dark:text-slate-300">Minggu Ini</button>
                        <button onClick={() => handlePreset('month')} className="px-3 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-700 shadow-sm dark:text-white text-slate-800">Bulan Ini</button>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Output */}
                <div className="glass-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                            <Factory size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Total Produksi</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {summary.totalOutputSacks.toLocaleString()} <span className="text-sm font-medium text-slate-500">Sak</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            ≈ {(summary.totalOutputSacks * 50).toLocaleString()} Kg
                        </p>
                    </div>
                </div>

                {/* Total Solar Used */}
                <div className="glass-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                            <Fuel size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Solar Terpakai</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {summary.totalSolarUsed.toLocaleString()} <span className="text-sm font-medium text-slate-500">Liter</span>
                        </h3>
                    </div>
                </div>

                {/* Efficiency */}
                <div className="glass-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                            <Droplets size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Rasio Efisiensi</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {summary.efficiency.toFixed(2)} <span className="text-sm font-medium text-slate-500">L/Sak</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            Rata-rata pemakaian solar
                        </p>
                    </div>
                </div>

                {/* Stock Alert (Real-time) */}
                <div className={cn(
                    "glass-card transition-colors",
                    summary.minSolarAlert
                        ? "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : ""
                )}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                            "p-3 rounded-lg",
                            summary.minSolarAlert ? "bg-red-100 text-red-600" : "bg-green-50 dark:bg-green-900/20 text-green-600"
                        )}>
                            {summary.minSolarAlert ? <AlertTriangle size={24} /> : <Fuel size={24} />}
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Sisa Stok Solar</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className={cn(
                            "text-2xl font-bold",
                            summary.minSolarAlert ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"
                        )}>
                            {summary.currentSolarStock.toLocaleString()} <span className="text-sm font-medium text-slate-500">Liter</span>
                        </h3>
                        {summary.minSolarAlert && (
                            <p className="text-xs font-bold text-red-500 animate-pulse">
                                STOK KRITIS! SEGERA BELANJA.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        Rincian Produksi
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Jenis Produksi</th>
                                <th className="px-6 py-4 text-center">Output (Sak)</th>
                                <th className="px-6 py-4 text-center">Solar (Liter)</th>
                                <th className="px-6 py-4 text-right">Rasio (L/Sak)</th>
                                {userRole === 'OWNER' && <th className="px-6 py-4 text-center">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={userRole === 'OWNER' ? 6 : 5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={userRole === 'OWNER' ? 6 : 5} className="px-6 py-8 text-center text-slate-500">Tidak ada data pada rentang tanggal ini.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                            {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                log.type === 'Giling Onggok'
                                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                                    : "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                                            )}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">
                                            {log.outputSacks}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-orange-600 dark:text-orange-400">
                                            {log.solarUsed}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500">
                                            {log.ratio.toFixed(2)}
                                        </td>
                                        {userRole === 'OWNER' && (
                                            <td className="px-6 py-4 flex justify-center">
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
