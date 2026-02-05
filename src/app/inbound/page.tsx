"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, ArrowDownLeft, Box, Truck, FileText, Calendar, Scale, Wallet, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is installed as seen in layout

interface Product {
    id: number;
    name: string;
    type: string;
    category: string;
}

interface Supplier {
    id: number;
    name: string;
    contact: string;
    bankName: string;
    accountNumber: string;
    priceTier1: number;
    priceTier2: number;
    priceTier3: number;
}

export default function InboundPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [updatingPrice, setUpdatingPrice] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        productId: "",
        supplierId: "",
        date: new Date().toISOString().split('T')[0],
        driverName: "",
        licensePlate: "",
        sourceWarehouse: "", // Khusus Putusan
        manifestWeight: "",
        actualWeight: "",
        notes: "",
        priceTier: "", // Selected Price Tier (1/2/3) for logic
        pricePerKg: "" // Editable Price
    });

    // Derived State
    const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
    const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplierId));

    const isPutusan = selectedProduct?.type === "Putusan";
    const isOnggok = selectedProduct?.type === "Onggok";

    // Calculations
    const manifest = parseFloat(formData.manifestWeight) || 0;
    const actual = parseFloat(formData.actualWeight) || 0;
    const weightDiff = isOnggok ? (actual - manifest) : 0; // Selisih = Bongkar - Surat Jalan

    // Total Payment Calculation
    const effectivePrice = parseFloat(formData.pricePerKg) || 0;
    const totalPrice = actual * effectivePrice;

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        fetch('/api/products').then(res => res.json()).then(data => {
            const filtered = data.filter((p: any) => p.category === 'Barang Mentah');
            setProducts(filtered);
        });
        fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
    }

    // Auto-select and lock Supplier for Putusan
    useEffect(() => {
        if (isPutusan) {
            const defaultSupplier = suppliers.find(s => s.name.includes("Menara Laut Bersatu"));
            if (defaultSupplier) {
                setFormData(prev => ({ ...prev, supplierId: defaultSupplier.id.toString() }));
            }
        }
    }, [isPutusan, suppliers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'IN',
                    productId: formData.productId,
                    supplierId: formData.supplierId,
                    quantity: actual,
                    date: formData.date,
                    driverName: formData.driverName,
                    licensePlate: formData.licensePlate,
                    sourceWarehouse: isPutusan ? formData.sourceWarehouse : null,
                    manifestWeight: isOnggok ? manifest : 0,
                    actualWeight: actual,
                    weightDiff: isOnggok ? weightDiff : 0,
                    notes: `Gudang Utama - ${formData.notes}`,
                    pricePerKg: effectivePrice,
                    totalPrice: totalPrice
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success("Transaksi berhasil disimpan");
            router.push('/transactions');
            router.refresh();
        } catch (err) {
            toast.error('Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tier = e.target.value;
        let price = "";

        if (selectedSupplier) {
            if (tier === "1") price = (selectedSupplier.priceTier1 || 0).toString();
            if (tier === "2") price = (selectedSupplier.priceTier2 || 0).toString();
            if (tier === "3") price = (selectedSupplier.priceTier3 || 0).toString();
        }

        setFormData(prev => ({
            ...prev,
            priceTier: tier,
            pricePerKg: price
        }));
    };

    const handleUpdateSupplierPrice = async () => {
        if (!selectedSupplier || !formData.priceTier || !formData.pricePerKg) return;

        setUpdatingPrice(true);
        const newPrice = parseFloat(formData.pricePerKg);
        const tierKey = `priceTier${formData.priceTier}` as keyof Supplier;

        // Construct update payload (reuse existing fields to avoid erasing them)
        const updatedSupplier = {
            ...selectedSupplier,
            [tierKey]: newPrice
        };

        try {
            const res = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSupplier)
            });

            if (!res.ok) throw new Error("Gagal update supplier");

            // Update local state to reflect change in dropdown
            setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? updatedSupplier : s));

            toast.success(`Harga Opsi ${formData.priceTier} berhasil diperbarui ke Rp ${newPrice}`);
        } catch (error) {
            toast.error("Gagal memperbarui harga supplier");
        } finally {
            setUpdatingPrice(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <ArrowLeft className="text-slate-600 dark:text-slate-300" size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/30">
                            <ArrowDownLeft size={20} />
                        </div>
                        Barang Masuk (Inbound)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat penerimaan barang baru ke Gudang Utama.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Primary Data */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Box className="text-indigo-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Informasi Barang</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jenis Barang</label>
                                <select
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleChange}
                                    required
                                    className="input-modern w-full"
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supplier / Pengirim</label>
                                <select
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleChange}
                                    disabled={isPutusan}
                                    className={cn(
                                        "input-modern w-full",
                                        isPutusan && "bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                                    )}
                                >
                                    <option value="">-- Pilih Supplier --</option>
                                    {suppliers
                                        .filter(s => !(isOnggok && s.name.includes("Menara Laut Bersatu")))
                                        .map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {selectedSupplier && isOnggok && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wallet className="text-amber-600" size={18} />
                                    <h4 className="font-bold text-amber-800 dark:text-amber-500 text-sm uppercase">Penentuan Harga Beli</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">1. Pilih Variasi</label>
                                        <select
                                            value={formData.priceTier}
                                            onChange={handleTierSelect}
                                            className="input-modern w-full bg-white dark:bg-slate-900"
                                        >
                                            <option value="">-- Pilih Opsi Harga --</option>
                                            <option value="1">Opsi 1 (Rp {selectedSupplier.priceTier1?.toLocaleString()})</option>
                                            <option value="2">Opsi 2 (Rp {selectedSupplier.priceTier2?.toLocaleString()})</option>
                                            <option value="3">Opsi 3 (Rp {selectedSupplier.priceTier3?.toLocaleString()})</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">2. Harga Deal / Kg</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                                                <input
                                                    type="number"
                                                    name="pricePerKg"
                                                    value={formData.pricePerKg}
                                                    onChange={handleChange}
                                                    className="input-modern w-full pl-10 font-bold text-slate-800 dark:text-slate-100"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleUpdateSupplierPrice}
                                                disabled={updatingPrice || !formData.priceTier}
                                                title={!formData.priceTier ? "Pilih variasi harga terlebih dahulu" : "Simpan harga ini sebagai default"}
                                                className={cn(
                                                    "px-3 rounded-lg transition-colors border flex items-center gap-2",
                                                    !formData.priceTier
                                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800"
                                                )}
                                            >
                                                {updatingPrice ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                                <span className="hidden md:inline text-xs font-bold">Apply</span>
                                            </button>
                                        </div>
                                        {formData.priceTier ? (
                                            <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 italic">
                                                *Klik <strong>Apply</strong> untuk mengubah harga Opsi {formData.priceTier} di database Supplier.
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 italic">
                                                *Pilih opsi harga untuk mengaktifkan tombol Apply.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPutusan && (
                            <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/50">
                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-2 block">ℹ️ Khusus Putusan</span>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gudang Asal</label>
                                <select
                                    name="sourceWarehouse"
                                    value={formData.sourceWarehouse}
                                    onChange={handleChange}
                                    required={isPutusan}
                                    className="input-modern w-full"
                                >
                                    <option value="">-- Pilih Gudang Asal --</option>
                                    <option value="MLB 1">MLB 1</option>
                                    <option value="MLB 2">MLB 2</option>
                                    <option value="MLB 3">MLB 3</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="glass-card space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Truck className="text-indigo-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Logistik</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                Tanggal
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="input-modern w-full"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Supir (Opsional)</label>
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleChange}
                                    placeholder="Nama Pak Supir"
                                    className="input-modern w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">No Polisi</label>
                                <input
                                    type="text"
                                    name="licensePlate"
                                    value={formData.licensePlate}
                                    onChange={handleChange}
                                    placeholder="B 1234 XY"
                                    className="input-modern w-full uppercase font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <FileText size={14} className="text-slate-400" />
                                Catatan (Opsional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                                className="input-modern w-full resize-none"
                                placeholder="Tambahkan catatan jika perlu..."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Calculations */}
                <div className="space-y-6">
                    <div className="glass-card space-y-6 sticky top-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Scale className="text-emerald-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Detail Berat & Pembayaran</h3>
                        </div>

                        {isOnggok ? (
                            // JIKA ONGGOK: Input Surat Jalan vs Bongkar
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Berat Surat Jalan (Kg)</label>
                                    <input
                                        type="number"
                                        name="manifestWeight"
                                        value={formData.manifestWeight}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="input-modern w-full font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Berat Bongkar (Kg)</label>
                                    <input
                                        type="number"
                                        name="actualWeight"
                                        value={formData.actualWeight}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="input-modern w-full text-2xl font-bold text-center h-16 text-emerald-600 dark:text-emerald-400"
                                    />
                                    <p className="text-xs text-center text-slate-500">Dasar Perhitungan Pembayaran</p>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {weightDiff > 0 ? "Penambahan:" : "Penyusutan:"}
                                        </span>
                                        <span className={cn("font-bold text-lg", weightDiff > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                                            {weightDiff > 0 ? "+" : ""}{weightDiff.toLocaleString()} Kg
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 text-right italic">(Selisih = Bongkar - SJ)</p>
                                </div>
                            </div>
                        ) : (
                            // JIKA BUKAN ONGGOK: Input Tunggal
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Berat Masuk (Kg)</label>
                                <input
                                    type="number"
                                    name="actualWeight"
                                    value={formData.actualWeight}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="input-modern w-full text-3xl font-bold h-20 text-center text-emerald-600 dark:text-emerald-400"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">Masukkan total berat besi/barang yang diterima.</p>
                            </div>
                        )}

                        {/* Payment Summary */}
                        {effectivePrice > 0 && actual > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Harga Satuan</span>
                                    <span className="font-medium">Rp {effectivePrice.toLocaleString()}/kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Total Berat</span>
                                    <span className="font-medium">{actual.toLocaleString()} kg</span>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wide block mb-1">Total Harus Dibayar</label>
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        Rp {totalPrice.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={loading || (isOnggok && !formData.pricePerKg)} // Disable if Onggok but no price set
                                className="w-full py-4 btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Simpan Transaksi Masuk
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
