"use client";

import { useState, useEffect } from "react";
import { Filter, FileText, Calendar, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
    id: number;
    date: string;
    totalPresent: number;
    totalAbsent: number;
    totalMealAllowance?: number;
}

export default function YearlyReportPage() {
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/attendance');
                const data = await res.json();
                setHistory(data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

    // Aggregate Data per Month
    const monthlyData = months.map((monthName, index) => {
        const monthRecords = history.filter(record => {
            const d = new Date(record.date);
            return d.getFullYear() === year && d.getMonth() === index;
        });

        const totalPresent = monthRecords.reduce((sum, r) => sum + r.totalPresent, 0);
        const totalAbsent = monthRecords.reduce((sum, r) => sum + r.totalAbsent, 0);
        const totalMealCost = monthRecords.reduce((sum, r) => sum + (r.totalMealAllowance || 0), 0);

        return {
            monthName,
            totalPresent,
            totalAbsent,
            totalMealCost,
            recordCount: monthRecords.length
        };
    });

    const yearlyTotalCost = monthlyData.reduce((sum, m) => sum + m.totalMealCost, 0);
    const yearlyTotalPresent = monthlyData.reduce((sum, m) => sum + m.totalPresent, 0);
    const yearlyTotalAbsent = monthlyData.reduce((sum, m) => sum + m.totalAbsent, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Laporan Tahunan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Rekapitulasi absensi dan pengeluaran per bulan.</p>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Filter size={16} className="text-slate-400 ml-2" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">Tahun</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        {years.map(y => (
                            <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Pengeluaran ({year})</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            Rp {yearlyTotalCost.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Monthly Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Rincian Bulan - Tahun {year}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Bulan</th>
                                <th className="px-6 py-4 text-center">Total Hadir</th>
                                <th className="px-6 py-4 text-center">Total Absen</th>
                                <th className="px-6 py-4 text-right">Total Uang Makan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                                </tr>
                            ) : (
                                <>
                                    {monthlyData.map((data, idx) => (
                                        <tr key={idx} className={cn("transition-colors", data.recordCount > 0 ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "opacity-50")}>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {data.monthName}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-green-600">
                                                {data.totalPresent}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-red-500">
                                                {data.totalAbsent}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-blue-600">
                                                {data.totalMealCost > 0 ? `Rp ${data.totalMealCost.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Grand Total Row */}
                                    <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                                        <td className="px-6 py-4 text-slate-800 dark:text-white uppercase tracking-wider">
                                            Grand Total {year}
                                        </td>
                                        <td className="px-6 py-4 text-center text-green-700 dark:text-green-400">
                                            {yearlyTotalPresent}
                                        </td>
                                        <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                                            {yearlyTotalAbsent}
                                        </td>
                                        <td className="px-6 py-4 text-right text-blue-700 dark:text-blue-400 font-mono text-base">
                                            Rp {yearlyTotalCost.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
