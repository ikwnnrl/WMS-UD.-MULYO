"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, ArrowUpRight, Truck, User, FileText, Calendar, Box } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Product {
    id: number;
    name: string;
    type: string;
    quantity: number;
}

export default function OutboundPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    // State untuk opsi Bantuan
    const [isAssistance, setIsAssistance] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        productId: "",
        date: new Date().toISOString().split('T')[0],

        // Static Fields
        source: "UD. Mulyo",
        destination: "PT. Menara Laut Bersatu",

        // Outbound Specific
        destinationWarehouse: "MLB 1", // Default to MLB 1
        poNumber: "",
        suratJalanNumber: "",

        quantity: "",

        driverName: "",
        licensePlate: "R 9750 BT", // Default

        notes: ""
    });

    const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
    const currentStock = selectedProduct?.quantity || 0;

    // Fetch Data
    useEffect(() => {
        fetch('/api/products').then(res => res.json()).then(data => {
            // Filter: Hanya Barang Jadi (Tepung)
            const filtered = data.filter((p: any) => p.category === 'Barang Jadi');
            setProducts(filtered);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const qty = parseFloat(formData.quantity);
        if (selectedProduct && qty > selectedProduct.quantity) {
            alert(`Stok tidak cukup! Stok tersedia: ${selectedProduct.quantity} Kg`);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'OUT',
                    productId: formData.productId,
                    quantity: qty,
                    date: formData.date,

                    // Fields
                    sourceWarehouse: null, // Outbound doesn't use source warehouse in the same way (it's from main)
                    destinationWarehouse: formData.destinationWarehouse,
                    poNumber: formData.poNumber,
                    suratJalanNumber: formData.suratJalanNumber,

                    driverName: formData.driverName,
                    licensePlate: formData.licensePlate,

                    notes: `Outbound ke ${formData.destination} (${formData.destinationWarehouse}) - ${isAssistance ? 'Bantuan ' : ''}${formData.notes}`
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            router.push('/transactions');
            router.refresh();
        } catch (err) {
            alert('Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <ArrowLeft className="text-slate-600 dark:text-slate-300" size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-500/30">
                            <ArrowUpRight size={20} />
                        </div>
                        Barang Keluar (Outbound)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat pengiriman barang ke gudang tujuan (MLB).</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Product & Destination */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Information Card */}
                    <div className="glass-card space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Box className="text-indigo-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Informasi Barang & Tujuan</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Barang</label>
                                <select
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleChange}
                                    required
                                    className="input-modern w-full"
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {selectedProduct && (
                                    <p className="text-xs text-slate-500 text-right">
                                        Stok Tersedia: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.quantity.toLocaleString()} Kg</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gudang Tujuan</label>
                                <select
                                    name="destinationWarehouse"
                                    value={formData.destinationWarehouse}
                                    onChange={handleChange}
                                    required
                                    className="input-modern w-full"
                                >
                                    <option value="MLB 1">MLB 1</option>
                                    <option value="MLB 2">MLB 2</option>
                                    <option value="MLB 3">MLB 3</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Dari</label>
                                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    {formData.source}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ke</label>
                                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    PT. Menara Laut Bersatu
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">No PO</label>
                                <input
                                    type="text"
                                    name="poNumber"
                                    value={formData.poNumber}
                                    onChange={handleChange}
                                    placeholder="Contoh: PO-XXX-2024"
                                    required
                                    className="input-modern w-full font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">No Surat Jalan</label>
                                <input
                                    type="text"
                                    name="suratJalanNumber"
                                    value={formData.suratJalanNumber}
                                    onChange={handleChange}
                                    placeholder="Contoh: SJ-XXX-2024"
                                    required
                                    className="input-modern w-full font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistics Card (Fixed Alignment) */}
                    <div className="glass-card space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Truck className="text-indigo-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Logistik & Supir</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    Nama Supir
                                </label>
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleChange}
                                    placeholder="Input nama supir..."
                                    required
                                    className="input-modern w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Truck size={14} className="text-slate-400" />
                                        Plat Nomor
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isAssistance}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setIsAssistance(checked);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    licensePlate: checked ? "" : "R 9750 BT"
                                                }));
                                            }}
                                            className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                        />
                                        <span className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors">Truk Teman?</span>
                                    </label>
                                </div>
                                {isAssistance ? (
                                    <input
                                        type="text"
                                        name="licensePlate"
                                        value={formData.licensePlate}
                                        onChange={handleChange}
                                        placeholder="AA 1234 BB"
                                        required
                                        className="input-modern w-full uppercase font-mono bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 focus:border-yellow-500 focus:ring-yellow-500/20"
                                    />
                                ) : (
                                    <select
                                        name="licensePlate"
                                        value={formData.licensePlate}
                                        onChange={handleChange}
                                        required
                                        className="input-modern w-full font-mono"
                                    >
                                        <option value="R 9750 BT">R 9750 BT</option>
                                        <option value="G 8489 LZ">G 8489 LZ</option>
                                    </select>
                                )}
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

                {/* Right Column: Weight & Actions */}
                <div className="space-y-6">
                    <div className="glass-card space-y-6 sticky top-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Box className="text-orange-500" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Detail Muatan</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                Tanggal Keluar
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="input-modern w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Berat Barang (Kg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="0"
                                    required
                                    className="input-modern w-full text-3xl font-bold h-20 text-center text-orange-600 dark:text-orange-400"
                                />
                            </div>
                            {currentStock > 0 && (
                                <div className="flex justify-between text-xs text-slate-500 px-1">
                                    <span>Max. Muat:</span>
                                    <span>{currentStock.toLocaleString()} Kg</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between mb-4 text-sm">
                                <span className="text-slate-500">Estimasi Total</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.quantity ? parseFloat(formData.quantity).toLocaleString() : 0} Kg</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 btn-primary bg-orange-600 hover:bg-orange-700 shadow-orange-500/30"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <ArrowUpRight size={20} />}
                                Simpan Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
