"use client";

import { useState, useEffect } from "react";
import { Receipt, Loader2, CheckCircle2, Circle, Printer, Search } from "lucide-react";

interface InvoiceRow {
    id: number;
    invoiceNumber: string;
    date: string;
    itemName?: string;
    quantity?: number;
    pricePerKg?: number;
    total: number;
    isPaid: boolean;
    customer?: { name: string } | null;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState<number | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = () => {
        setLoading(true);
        fetch('/api/invoices', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setInvoices(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const togglePaid = async (inv: InvoiceRow) => {
        setTogglingId(inv.id);
        try {
            const res = await fetch(`/api/invoices/${inv.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid: !inv.isPaid }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal mengubah status");
            }
            fetchInvoices();
        } catch (err: any) {
            alert(err.message || "Gagal mengubah status.");
        } finally {
            setTogglingId(null);
        }
    };

    const filtered = invoices.filter(inv => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            inv.invoiceNumber.toLowerCase().includes(term) ||
            inv.customer?.name.toLowerCase().includes(term) ||
            inv.itemName?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                            <Receipt size={24} />
                        </div>
                        Invoice
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Riwayat invoice yang telah dibuat dari transaksi Outbound.
                    </p>
                </div>
            </div>

            <div className="glass-card flex items-center gap-4 py-4">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari nomor invoice, pelanggan, atau barang..."
                    className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">No. Invoice</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Tanggal</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Pelanggan</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Barang</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Total</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Status</th>
                                <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-500 dark:text-slate-400">
                                    <Loader2 className="animate-spin inline text-emerald-500" size={24} />
                                </td></tr>
                            ) : filtered.length > 0 ? (
                                filtered.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${inv.isPaid ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                                    >
                                        <td className="p-5 font-mono font-bold text-slate-700 dark:text-slate-200">{inv.invoiceNumber}</td>
                                        <td className="p-5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(inv.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-5 text-slate-700 dark:text-slate-300">{inv.customer?.name || '-'}</td>
                                        <td className="p-5 text-slate-600 dark:text-slate-400">
                                            {inv.itemName || '-'} {inv.quantity ? `(${inv.quantity.toLocaleString('id-ID')} Kg)` : ''}
                                        </td>
                                        <td className="p-5 text-right font-bold text-slate-800 dark:text-slate-200">
                                            Rp {Math.round(inv.total).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={() => togglePaid(inv)}
                                                disabled={togglingId === inv.id}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${inv.isPaid
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                            >
                                                {togglingId === inv.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : inv.isPaid ? (
                                                    <CheckCircle2 size={14} />
                                                ) : (
                                                    <Circle size={14} />
                                                )}
                                                {inv.isPaid ? 'Lunas' : 'Belum Lunas'}
                                            </button>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")}
                                                className="p-2 bg-slate-100 hover:bg-white border border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 rounded-lg transition-all shadow-sm"
                                                title="Cetak Invoice"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Receipt size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">Belum ada invoice</p>
                                            <p className="text-sm">Buat invoice dari halaman Log Stok / transaksi Outbound.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
