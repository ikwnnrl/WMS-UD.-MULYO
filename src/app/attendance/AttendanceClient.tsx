"use client";

import { useState, useEffect } from "react";
import { UserCheck, UserX, Calendar, Save, History, Loader2, Users, Pencil, Trash2, X, Clock, Mail, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ExportButton from "@/components/ExportButton";

interface Employee {
    id: number;
    name: string;
    isActive: boolean;
}

interface AttendanceRecord {
    id: number;
    date: string;
    totalPresent: number;
    totalAbsent: number;
    totalMealAllowance?: number;
    absentList: string;
    details?: string;
    notes?: string;
}

type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'PERMIT' | 'ABSENT' | 'SICK';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string, icon: any, color: string, bg: string }> = {
    PRESENT: { label: 'Hadir', icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
    HALF_DAY: { label: '½ Hari', icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' },
    PERMIT: { label: 'Izin', icon: Mail, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
    SICK: { label: 'Sakit', icon: AlertCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
    ABSENT: { label: 'Alpha', icon: UserX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
};

export default function AttendanceClient({ userRole }: { userRole: string }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [statusMap, setStatusMap] = useState<Record<number, AttendanceStatus>>({});
    const [notesMap, setNotesMap] = useState<Record<number, string>>({}); // Store notes per employee ID

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [tempStatus, setTempStatus] = useState<AttendanceStatus>('PRESENT');
    const [tempNote, setTempNote] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Initial Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Employees
                const empRes = await fetch('/api/employees');
                const empData = await empRes.json();

                if (Array.isArray(empData)) {
                    setEmployees(empData);
                    // Initialize Default Status and Notes
                    const initialStatus: Record<number, AttendanceStatus> = {};
                    const initialNotes: Record<number, string> = {};
                    empData.forEach(e => {
                        initialStatus[e.id] = 'PRESENT';
                        initialNotes[e.id] = '';
                    });
                    setStatusMap(initialStatus);
                    setNotesMap(initialNotes);
                } else {
                    setEmployees([]);
                }

                // Fetch History
                const histRes = await fetch('/api/attendance');
                const histData = await histRes.json();
                setHistory(histData);
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Handle Card Click
    const handleCardClick = (emp: Employee) => {
        setSelectedEmp(emp);
        setTempStatus(statusMap[emp.id] || 'PRESENT');
        setTempNote(notesMap[emp.id] || ""); // Initialize tempNote from notesMap
        setModalOpen(true);
    };

    // Save from Modal
    const saveModal = () => {
        if (selectedEmp) {
            setStatusMap(prev => ({ ...prev, [selectedEmp.id]: tempStatus }));
            setNotesMap(prev => ({ ...prev, [selectedEmp.id]: tempNote }));
        }
        setModalOpen(false);
    };

    // Calculate Stats
    const getStats = () => {
        const values = Object.values(statusMap);
        const presentCount = values.filter(s => s === 'PRESENT' || s === 'HALF_DAY').length; // Half day counts as present for headcount? Usually yes.
        const absentCount = values.filter(s => s !== 'PRESENT' && s !== 'HALF_DAY').length;

        // Est Meal Allowance
        let mealMoney = 0;
        values.forEach(s => {
            if (s === 'PRESENT') mealMoney += 25000;
            if (s === 'HALF_DAY') mealMoney += 12500;
        });

        return { presentCount, absentCount, mealMoney };
    };

    const stats = getStats();

    const handleSubmit = async () => {
        setSaving(true);
        try {
            // Construct Details JSON (Name -> { status, note })
            const detailsJson: Record<string, { status: AttendanceStatus, note: string }> = {};
            const absentNames: string[] = [];

            employees.forEach(e => {
                const status = statusMap[e.id] || 'PRESENT';
                const note = notesMap[e.id] || "";

                detailsJson[e.name] = { status, note };

                if (status !== 'PRESENT' && status !== 'HALF_DAY') {
                    absentNames.push(e.name);
                }
            });

            const payload = {
                date: selectedDate,
                totalPresent: stats.presentCount,
                totalAbsent: stats.absentCount,
                absentList: absentNames,
                details: JSON.stringify(detailsJson),
                notes: `Absensi Harian - Hadir: ${stats.presentCount}, Absen: ${stats.absentCount}`
            };

            const url = editingId ? `/api/attendance/${editingId}` : '/api/attendance';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedRecord = await res.json();
                if (editingId) {
                    setHistory(prev => prev.map(rec => rec.id === editingId ? savedRecord : rec));
                    alert("Absensi berhasil diperbarui!");
                    cancelEdit();
                } else {
                    setHistory(prev => [savedRecord, ...prev]);
                    alert("Absensi berhasil disimpan!");
                }
            } else {
                const errData = await res.json();
                alert(`Gagal menyimpan: ${errData.error}`);
            }
        } catch (err: any) {
            alert(`Terjadi kesalahan: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (record: AttendanceRecord) => {
        setEditingId(record.id);
        setSelectedDate(new Date(record.date).toISOString().split('T')[0]);

        const newStatusMap: Record<number, AttendanceStatus> = {};
        const newNotesMap: Record<number, string> = {};

        // Try parsing details first
        if (record.details) {
            try {
                const details = JSON.parse(record.details);
                // details is Name -> { status, note } OR Name -> Status (Legacy)
                employees.forEach(e => {
                    const entry = details[e.name];
                    if (entry) {
                        if (typeof entry === 'object' && entry.status) {
                            newStatusMap[e.id] = entry.status as AttendanceStatus;
                            newNotesMap[e.id] = entry.note || "";
                        } else if (typeof entry === 'string') {
                            newStatusMap[e.id] = entry as AttendanceStatus;
                            newNotesMap[e.id] = "";
                        } else {
                            newStatusMap[e.id] = 'PRESENT';
                            newNotesMap[e.id] = "";
                        }
                    } else {
                        newStatusMap[e.id] = 'PRESENT';
                        newNotesMap[e.id] = "";
                    }
                });
            } catch (e) {
                console.error("Failed to parse details", e);
            }
        } else {
            // Fallback to absentList (Legacy)
            try {
                const absentNames = JSON.parse(record.absentList) as string[];
                employees.forEach(e => {
                    newStatusMap[e.id] = absentNames.includes(e.name) ? 'ABSENT' : 'PRESENT';
                    newNotesMap[e.id] = "";
                });
            } catch (e) {
                const absentNames = record.absentList.split(','); // Fallback for comma sep
                employees.forEach(e => {
                    newStatusMap[e.id] = absentNames.includes(e.name) ? 'ABSENT' : 'PRESENT';
                    newNotesMap[e.id] = "";
                });
            }
        }

        setStatusMap(newStatusMap);
        setNotesMap(newNotesMap);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus riwayat absensi ini?")) return;
        try {
            const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(rec => rec.id !== id));
                if (editingId === id) cancelEdit();
            }
        } catch (err) {
            alert("Gagal menghapus.");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSelectedDate(today);
        // Reset to all present
        const initialStatus: Record<number, AttendanceStatus> = {};
        employees.forEach(e => initialStatus[e.id] = 'PRESENT');
        setStatusMap(initialStatus);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[var(--radius-lg)] shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Absensi Karyawan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat kehadiran harian karyawan.</p>
                </div>
                <div className="flex items-center gap-2">
                    {editingId && (
                        <button onClick={cancelEdit} className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm mr-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1">
                            <X size={14} /> Batal Edit
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                        <Calendar size={18} className="text-slate-500 ml-1" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent outline-none text-slate-700 dark:text-slate-200 text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Employee List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className={cn("glass-card transition-colors", editingId ? "ring-1 ring-blue-500" : "")}>
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                {editingId ? (
                                    <span className="flex items-center gap-2 text-blue-600">
                                        <Pencil size={18} /> Edit Absensi
                                    </span>
                                ) : "Daftar Karyawan"}
                            </h2>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                    <UserCheck size={16} /> Hadir: {stats.presentCount}
                                </span>
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                    <UserX size={16} /> Absen: {stats.absentCount}
                                </span>
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                    <span className="text-xs">💰</span> Est. Rp {stats.mealMoney.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-slate-500 flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-blue-500" />
                                Memuat karyawan...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {employees.map(emp => {
                                    const status = statusMap[emp.id] || 'PRESENT';
                                    const config = STATUS_CONFIG[status] || STATUS_CONFIG['PRESENT'];
                                    const Icon = config.icon;

                                    return (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleCardClick(emp)}
                                            className={cn(
                                                "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 group relative overflow-hidden",
                                                config.bg, config.color,
                                                "hover:scale-[1.02] active:scale-95 shadow-sm"
                                            )}
                                        >
                                            <Icon size={24} className="mb-1" />
                                            <span className="text-center leading-tight truncate w-full">{emp.name}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{config.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className={cn("btn-primary w-full sm:w-auto px-8 flex items-center justify-center gap-2", editingId ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30" : "")}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {editingId ? "Update Absensi" : "Simpan Absensi Hari Ini"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: History */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[var(--radius-lg)] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-6">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <History size={18} /> Riwayat Absensi
                            </h3>
                            <ExportButton
                                data={history.map(h => ({
                                    Tanggal: new Date(h.date).toLocaleDateString('id-ID'),
                                    Hadir: h.totalPresent,
                                    Absen: h.totalAbsent,
                                    UangMakan: h.totalMealAllowance || 0,
                                    Detail: h.details ? JSON.parse(h.details) : h.absentList
                                }))}
                                filename={`Rekap_Absensi_${new Date().toISOString().split('T')[0]}`}
                                className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 h-8 px-3 text-xs"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {history.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic text-sm">Belum ada riwayat.</div>
                            ) : (
                                <div className="space-y-2">
                                    {history.map(record => {
                                        const isEditing = editingId === record.id;

                                        // Parse Details
                                        let details: Record<string, any> = {};
                                        try {
                                            if (record.details) details = JSON.parse(record.details);
                                        } catch (e) { }

                                        const getStatus = (val: any) => typeof val === 'object' ? val.status : val;

                                        const absentCount = record.totalAbsent;
                                        const halfDayCount = Object.values(details).filter(v => getStatus(v) === 'HALF_DAY').length;
                                        const permitCount = Object.values(details).filter(v => getStatus(v) === 'PERMIT').length;
                                        const sickCount = Object.values(details).filter(v => getStatus(v) === 'SICK').length;
                                        const alphaCount = Object.values(details).filter(v => getStatus(v) === 'ABSENT').length;

                                        return (
                                            <div key={record.id} className={cn("p-4 rounded-xl border transition-all group relative", isEditing ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm")}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">
                                                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <span className="text-xs font-mono bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-400 inline-block">
                                                                Hadir: {record.totalPresent}
                                                            </span>
                                                            <span className="text-xs font-mono bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-red-700 dark:text-red-400 inline-block">
                                                                Absen: {record.totalAbsent}
                                                            </span>
                                                        </div>
                                                        {record.totalMealAllowance !== undefined && (
                                                            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-600 dark:text-blue-400 mt-2 inline-block">
                                                                Rp {record.totalMealAllowance.toLocaleString('id-ID')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {userRole === 'OWNER' && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white dark:bg-slate-900 shadow-sm p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <button onClick={() => handleEdit(record)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(record.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details Badges */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {halfDayCount > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded border border-orange-200">½ Hari: {halfDayCount}</span>}
                                                    {permitCount > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">Izin: {permitCount}</span>}
                                                    {sickCount > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200">Sakit: {sickCount}</span>}
                                                    {alphaCount > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200">Alpha: {alphaCount}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {modalOpen && selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div
                        className="glass-card w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                                    <Users size={18} />
                                </span>
                                Update: <span className="text-blue-600 dark:text-blue-400">{selectedEmp.name}</span>
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                                    if (status === 'HALF_DAY' && userRole !== 'OWNER') return null;

                                    const config = STATUS_CONFIG[status];
                                    const Icon = config.icon;
                                    const isSelected = tempStatus === status;

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => setTempStatus(status)}
                                            className={cn(
                                                "p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                isSelected
                                                    ? `bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 ring-4 ring-slate-200 dark:ring-slate-800`
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            <Icon size={18} />
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {tempStatus !== 'PRESENT' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                        Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        value={tempNote}
                                        onChange={(e) => setTempNote(e.target.value)}
                                        placeholder={tempStatus === 'SICK' ? "Sakit apa?" : tempStatus === 'PERMIT' ? "Izin kemana?" : "Keterangan tambahan..."}
                                        className="input-modern w-full min-h-[100px] resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="btn-secondary flex-1"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveModal}
                                className="btn-primary flex-1 shadow-lg shadow-blue-500/20"
                            >
                                Simpan Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
