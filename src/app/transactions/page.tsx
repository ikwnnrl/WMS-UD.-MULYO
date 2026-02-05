
"use client";

import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, Pencil, Trash2, X, FileText, Loader2, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import ExportButton from "@/components/common/ExportButton";

interface Transaction {
    id: number;
    type: string;
    quantity: number;
    date: string;
    product: { id: number; name: string };
    productId: number;
    driverName?: string;
    licensePlate?: string;
    weightDiff?: number;
    notes?: string;
    sourceWarehouse?: string;
    manifestWeight?: number;
    actualWeight?: number;
    initialStock?: number;
    finalStock?: number;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");

    // Edit Form State
    const [formData, setFormData] = useState({
        type: "IN",
        quantity: "",
        date: "",
        driverName: "",
        licensePlate: "",
        notes: ""
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = () => {
        setLoading(true);
        fetch('/api/transactions', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            });
    };

    const handleEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setFormData({
            type: tx.type,
            quantity: tx.quantity.toString(),
            date: new Date(tx.date).toISOString().split('T')[0],
            driverName: tx.driverName || "",
            licensePlate: tx.licensePlate || "",
            notes: tx.notes || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus transaksi? Stok barang akan dikembalikan ke kondisi sebelum transaksi ini.")) return;

        try {
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Gagal menghapus");
            fetchTransactions();
        } catch (err) {
            alert("Gagal menghapus transaksi.");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTx(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/transactions/${editingTx.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    quantity: parseFloat(formData.quantity)
                })
            });

            if (!res.ok) throw new Error("Gagal update");

            handleCloseModal();
            fetchTransactions();
        } catch (err) {
            alert("Gagal mengupdate transaksi.");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter Transactions
    const filteredTransactions = transactions.filter(tx => {
        if (!search) return true;

        const terms = search.toLowerCase().split(" ").filter(term => term.length > 0);

        // Every term must be found in at least one of the fields (AND logic for terms)
        return terms.every(term => {
            const dateStr = new Date(tx.date).toLocaleDateString('id-ID').toLowerCase(); // Search by formatted date too
            return (
                tx.product.name.toLowerCase().includes(term) ||
                tx.type.toLowerCase().includes(term) ||
                tx.driverName?.toLowerCase().includes(term) ||
                tx.licensePlate?.toLowerCase().includes(term) ||
                tx.notes?.toLowerCase().includes(term) ||
                tx.date.includes(term) ||
                dateStr.includes(term) ||
                tx.quantity.toString().includes(term)
            );
        });
    });

    const getUnit = (productName: string) => {
        return productName.toLowerCase().includes("solar") ? "Liter" : "Kg";
    };

    const exportData = filteredTransactions.map(tx => ({
        ID: tx.id,
        Tanggal: new Date(tx.date).toLocaleDateString('id-ID'),
        Tipe: tx.type === 'IN' ? 'INBOUND' : 'OUTBOUND',
        Barang: tx.product.name,
        "Jumlah (Kg/L)": tx.quantity,
        Supir: tx.driverName || '-',
        "Plat No": tx.licensePlate || '-',
        Catatan: tx.notes || '-',
        "Stok Awal": tx.initialStock || 0,
        "Stok Akhir": tx.finalStock || 0
    }));

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                            <FileText size={24} />
                        </div>
                        Log Stok Barang
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Riwayat lengkap pergerakan barang masuk dan keluar.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton data={exportData} filename={`Laporan_Stok_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-card flex items-center gap-4 py-4">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari tanggal, tipe, barang, supir, atau catatan..."
                    className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Content Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Tanggal</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Tipe</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Barang</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Awal</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Perubahan</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Akhir</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Info Supir</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={8} className="p-10 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                                    Memuat data...
                                </td></tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-5">
                                            <span className={cn(
                                                "px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wide",
                                                tx.type === 'IN'
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800"
                                            )}>
                                                {tx.type === 'IN' ? 'INBOUND' : 'OUTBOUND'}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{tx.product.name}</div>
                                            {tx.type === 'IN' && tx.sourceWarehouse && (
                                                <div className="text-xs text-slate-400 mt-0.5">Dari: {tx.sourceWarehouse}</div>
                                            )}
                                        </td>

                                        {/* Awal */}
                                        <td className="p-5 text-right text-slate-400 dark:text-slate-500 font-mono text-sm">
                                            {tx.initialStock !== undefined ? `${tx.initialStock.toLocaleString()}` : '-'}
                                        </td>

                                        {/* Perubahan / Jumlah */}
                                        <td className="p-5 text-right font-bold">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg",
                                                tx.type === 'IN'
                                                    ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400"
                                            )}>
                                                <span>{tx.type === 'IN' ? '+' : '-'}</span>
                                                {tx.quantity.toLocaleString()} {getUnit(tx.product.name)}
                                            </div>
                                            {!!tx.weightDiff && (
                                                <div className={cn("text-[10px] text-right mt-1.5 font-medium", tx.weightDiff > 0 ? "text-red-500" : "text-emerald-500")}>
                                                    Selisih: {tx.weightDiff > 0 ? '+' : ''}{tx.weightDiff}
                                                </div>
                                            )}
                                        </td>

                                        {/* Akhir */}
                                        <td className="p-5 text-right text-slate-700 dark:text-slate-300 font-bold font-mono text-sm">
                                            {tx.finalStock !== undefined ? `${tx.finalStock.toLocaleString()}` : '-'}
                                        </td>

                                        <td className="p-5 text-sm text-slate-500 dark:text-slate-400">
                                            {tx.driverName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {tx.driverName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{tx.driverName}</p>
                                                        <p className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded inline-block">{tx.licensePlate}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">-</span>
                                            )}
                                        </td>
                                        <td className="p-5 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(tx)}
                                                className="p-2 bg-slate-100 hover:bg-white border border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 rounded-lg transition-all shadow-sm"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tx.id)}
                                                className="p-2 bg-slate-100 hover:bg-white border border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 rounded-lg transition-all shadow-sm"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Search size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">Data tidak ditemukan</p>
                                            <p className="text-sm">Coba cari dengan kata kunci lain.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && editingTx && (
                <div
                    className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-md"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Edit Transaksi #{editingTx.id}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/50 flex gap-3">
                            <div className="mt-0.5"><Filter size={16} /></div>
                            <div>
                                Perhatian: Mengubah jumlah akan otomatis menyesuaikan stok barang <strong>{editingTx.product.name}</strong> dan mungkin mempengaruhi saldo akhir.
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Tanggal</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-modern w-full"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Jumlah ({getUnit(editingTx.product.name)})</label>
                                    <input
                                        type="number"
                                        required
                                        className="input-modern w-full font-bold"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Supir</label>
                                    <input
                                        type="text"
                                        className="input-modern w-full"
                                        value={formData.driverName}
                                        onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Plat No</label>
                                    <input
                                        type="text"
                                        className="input-modern w-full font-mono uppercase"
                                        value={formData.licensePlate}
                                        onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Catatan</label>
                                <textarea
                                    className="input-modern w-full h-24 resize-none"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Tambahkan catatan..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-secondary flex-1"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary flex-1"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Update Transaksi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
