"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
    id: number;
    name: string;
}

interface AttendanceRecord {
    id: number;
    date: string; // YYYY-MM-DD
    absentList: string; // JSON string of names
}

export default function WeeklyReportPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [week, setWeek] = useState(1); // 1, 2, 3, 4

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const weeks = [1, 2, 3, 4];

    useEffect(() => {
        const loadData = async () => {
            try {
                const [empRes, attRes] = await Promise.all([
                    fetch('/api/employees'),
                    fetch('/api/attendance')
                ]);

                const empData = await empRes.json();
                const attData = await attRes.json();

                if (Array.isArray(empData)) setEmployees(empData);
                if (Array.isArray(attData)) setAttendanceHistory(attData);

            } catch (err) {
                console.error("Error loading data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper: Get Date Range for Selected Week
    const getWeekRange = (y: number, m: number, w: number) => {
        // Assumption: Week 1=1-7, Week 2=8-14, Week 3=15-21, Week 4=22-End
        let startDay = 1;
        let endDay = 7;

        if (w === 2) { startDay = 8; endDay = 14; }
        else if (w === 3) { startDay = 15; endDay = 21; }
        else if (w === 4) { startDay = 22; endDay = new Date(y, m + 1, 0).getDate(); } // Last day of month

        const dates: Date[] = [];
        for (let d = startDay; d <= endDay; d++) {
            dates.push(new Date(y, m, d));
        }
        return dates;
    };

    const weekDates = getWeekRange(year, month, week);

    // Process Data per Employee
    const reportData = employees.map(emp => {
        let presentCount = 0;
        let absentCount = 0;

        const dailyStatus = weekDates.map(date => {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const record = attendanceHistory.find(r => r.date.startsWith(dateStr));

            if (!record) return { date, status: 'NO_DATA' };

            const absentNames = JSON.parse(record.absentList) as string[];
            if (absentNames.includes(emp.name)) {
                absentCount++;
                return { date, status: 'ABSENT' };
            } else {
                presentCount++;
                return { date, status: 'PRESENT' };
            }
        });

        return {
            ...emp,
            dailyStatus,
            presentCount,
            absentCount
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Laporan Mingguan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Rekap kehadiran per minggu untuk perhitungan gaji.</p>
                </div>

                <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-r border-slate-200 dark:border-slate-700 px-2"
                    >
                        {months.map((m, idx) => (
                            <option key={idx} value={idx} className="dark:bg-slate-900">{m}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-r border-slate-200 dark:border-slate-700 px-2"
                    >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-sm text-slate-500 font-medium">Minggu ke:</span>
                        <div className="flex gap-1">
                            {weeks.map(w => (
                                <button
                                    key={w}
                                    onClick={() => setWeek(w)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                                        week === w
                                            ? "bg-blue-600 text-white shadow-blue-200"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                    )}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4 min-w-[150px]">Nama Karyawan</th>
                                <th className="px-6 py-4 text-center">Detail Mingguan ({weekDates[0]?.getDate()} - {weekDates[weekDates.length - 1]?.getDate()})</th>
                                <th className="px-6 py-4 text-center">Hadir</th>
                                <th className="px-6 py-4 text-center">Absen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Tidak ada data karyawan.</td>
                                </tr>
                            ) : (
                                reportData.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                            {emp.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                {emp.dailyStatus.map((day, idx) => (
                                                    <div key={idx} className="flex flex-col items-center group">
                                                        <div className={cn(
                                                            "w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold mb-1",
                                                            day.status === 'PRESENT' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                day.status === 'ABSENT' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                    "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                                        )}>
                                                            {day.status === 'PRESENT' ? <CheckCircle size={14} /> :
                                                                day.status === 'ABSENT' ? <XCircle size={14} /> :
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {day.date.getDate()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-green-600">
                                            {emp.presentCount}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-red-500">
                                            {emp.absentCount}
                                        </td>
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
