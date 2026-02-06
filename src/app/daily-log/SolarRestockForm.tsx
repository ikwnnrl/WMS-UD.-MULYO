"use client";

import { useState } from "react";
import { Fuel, Save, Truck } from "lucide-react";
import { toast } from "sonner";

export default function SolarRestockForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        quantity: "",
        pricePerLiter: "6800",
        supplierName: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/solar/restock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal mengisi stok");
            }

            toast.success("Stok solar berhasil ditambahkan!");
            setFormData({
                date: new Date().toISOString().split('T')[0],
                quantity: "",
                pricePerLiter: formData.pricePerLiter, // Keep price
                supplierName: ""
            });

            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Gagal mengisi stok solar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal Isi</label>
                <input
                    type="date"
                    required
                    className="input-modern w-full"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah (Liter)</label>
                    <input
                        type="number"
                        required
                        placeholder="0"
                        className="input-modern w-full"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Harga / Liter</label>
                    <input
                        type="number"
                        required
                        placeholder="Rp"
                        className="input-modern w-full"
                        value={formData.pricePerLiter}
                        onChange={e => setFormData({ ...formData, pricePerLiter: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supplier / Ket (Opsional)</label>
                <div className="relative">
                    <Truck className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Contoh: SPBU Pertamina"
                        className="input-modern w-full pl-10"
                        value={formData.supplierName}
                        onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50"
            >
                {loading ? "Menyimpan..." : (
                    <>
                        <Save size={18} /> Tambah Stok
                    </>
                )}
            </button>
        </form>
    );
}
