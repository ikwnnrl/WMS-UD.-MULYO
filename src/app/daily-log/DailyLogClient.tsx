
"use client";

import { useState, useEffect } from "react";
import { Factory, Fuel, ArrowRight, Save, History, Trash2, Pencil } from "lucide-react";
import ExportButton from "@/components/common/ExportButton";
import { toast } from "sonner";

interface ProductionLog {
    id: number;
    date: string;
    type: string;
    rawMaterialName: string;
    rawMaterialQty: number;
    finishedGoodName: string;
    finishedGoodQty: number;
    solarQty: number;
    hppPerKg?: number;
    totalCost?: number;
}

export default function DailyLogClient({ userRole }: { userRole: string }) {
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: "Giling Onggok",
        finishedGoodQty: "",
        solarQty: "",
        notes: "",

    });

    const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
    const [editFormData, setEditFormData] = useState({
        date: "",
        type: "",
        finishedGoodQty: "",
        solarQty: "",
        notes: ""
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/daily-log');
            const data = await res.json();
            if (Array.isArray(data)) setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        }
    };

    const handleEditClick = (log: ProductionLog) => {
        setEditingLog(log);
        setEditFormData({
            date: new Date(log.date).toISOString().split('T')[0],
            type: log.type,
            finishedGoodQty: (log.finishedGoodQty / 50).toString(),
            solarQty: log.solarQty.toString(),
            notes: ""
        });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLog) return;
        if (!confirm("Simpan perubahan? Stok akan disesuaikan ulang.")) return;

        try {
            const res = await fetch(`/api/daily-log/${editingLog.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: editFormData.date,
                    type: editFormData.type,
                    finishedGoodQty: parseFloat(editFormData.finishedGoodQty) * 50,
                    solarQty: parseFloat(editFormData.solarQty),
                    notes: editFormData.notes
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal update");
            }

            toast.success("Data berhasil diperbarui!");
            setEditingLog(null);
            fetchLogs();
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui data.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus? Stok akan dikembalikan.")) return;

        try {
            const res = await fetch(`/api/daily-log/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menghapus");
            }
            toast.success("Data berhasil dihapus.");
            fetchLogs();
        } catch (err: any) {
            toast.error(err.message || "Gagal menghapus data.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/daily-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    finishedGoodQty: parseFloat(formData.finishedGoodQty) * 50,
                    solarQty: parseFloat(formData.solarQty),

                })
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Gagal menyimpan laporan");
            } else {
                toast.success("Laporan produksi dan HPP berhasil disimpan!");
                setFormData({
                    ...formData,
                    finishedGoodQty: "",
                    solarQty: "",
                    notes: "",

                });
                fetchLogs();
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    // Data for Export
    const exportData = logs.map(log => ({
        ID: log.id,
        Tanggal: new Date(log.date).toLocaleDateString('id-ID'),
        Jenis: log.type,
        "Bahan Baku (Kg)": log.rawMaterialQty,
        "Output (Sak)": Math.round(log.finishedGoodQty / 50),
        "Output (Kg)": log.finishedGoodQty,
        "Solar (L)": log.solarQty,
        ...(userRole === 'OWNER' ? { "HPP / Kg": log.hppPerKg || 0, "Total Biaya": log.totalCost || 0 } : {})
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Factory className="text-blue-600" />
                    Laporan Produksi Harian
                </h1>
                <p className="text-slate-500 dark:text-slate-400">Catat konversi bahan baku ke barang jadi & pemakaian solar.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                        <h2 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Input Produksi & HPP</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    className="input-modern w-full"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jenis Produksi</label>
                                <select
                                    className="input-modern w-full cursor-pointer"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Giling Onggok" className="dark:bg-slate-900">Giling Onggok</option>
                                    <option value="Giling Putusan" className="dark:bg-slate-900">Giling Putusan</option>
                                </select>
                            </div>



                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 block mb-1">
                                        Output: {formData.type === "Giling Onggok" ? "Tepung Onggok" : "Tepung Putusan"} (Sak / Karung)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        className="input-modern w-full border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 font-bold focus:ring-green-500"
                                        value={formData.finishedGoodQty}
                                        onChange={e => setFormData({ ...formData, finishedGoodQty: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                <label className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-2">
                                    <Fuel size={16} />
                                    Pemakaian Solar (Liter)
                                </label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0"
                                    className="input-modern w-full border-orange-200 dark:border-orange-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-orange-500"
                                    value={formData.solarQty}
                                    onChange={e => setFormData({ ...formData, solarQty: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Menyimpan..." : (
                                    <>
                                        <Save size={18} /> Simpan Laporan
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-full">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <History className="text-slate-400" />
                                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Riwayat Terakhir</h2>
                            </div>
                            <ExportButton data={exportData} filename={`Laporan_Produksi_${new Date().toISOString().split('T')[0]}`} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">Jenis</th>
                                        <th className="px-6 py-4">Bahan Baku (Kg)</th>
                                        <th className="px-6 py-4">Output (Sak)</th>
                                        <th className="px-6 py-4">Solar (L)</th>
                                        {userRole === 'OWNER' && <th className="px-6 py-4 text-emerald-600">HPP / Kg</th>}
                                        {userRole === 'OWNER' && <th className="px-6 py-4 text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={userRole === 'OWNER' ? 7 : 6} className="px-6 py-8 text-center text-slate-500">Belum ada data produksi.</td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                                    {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300 font-mono">
                                                    {log.rawMaterialQty?.toLocaleString()} Kg
                                                    <span className="text-xs font-normal text-slate-400 block">
                                                        (Input + Susut)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400 font-mono">
                                                    {Math.round((log.finishedGoodQty || 0) / 50)} Sak
                                                    <span className="text-xs font-normal text-slate-400 block">
                                                        ({log.finishedGoodQty?.toLocaleString()} Kg)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-orange-600 dark:text-orange-400 font-mono">
                                                    {log.solarQty}
                                                </td>
                                                {userRole === 'OWNER' && (
                                                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                        {log.hppPerKg ? `Rp ${log.hppPerKg.toLocaleString()}` : '-'}
                                                    </td>
                                                )}
                                                {userRole === 'OWNER' && (
                                                    <td className="px-6 py-4 flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(log)}
                                                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
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
            </div>
            {/* Edit Modal */}
            {editingLog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setEditingLog(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md p-6 border border-slate-100 dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Edit Laporan Produksi</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    className="input-modern w-full"
                                    value={editFormData.date}
                                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jenis</label>
                                <select
                                    className="input-modern w-full cursor-pointer"
                                    value={editFormData.type}
                                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                                >
                                    <option value="Giling Onggok">Giling Onggok</option>
                                    <option value="Giling Putusan">Giling Putusan</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Output (Sak)</label>
                                <input
                                    type="number"
                                    required
                                    className="input-modern w-full"
                                    value={editFormData.finishedGoodQty}
                                    onChange={e => setEditFormData({ ...editFormData, finishedGoodQty: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Solar (Liter)</label>
                                <input
                                    type="number"
                                    required
                                    className="input-modern w-full"
                                    value={editFormData.solarQty}
                                    onChange={e => setEditFormData({ ...editFormData, solarQty: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingLog(null)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
