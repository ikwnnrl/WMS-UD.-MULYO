"use client";

import { useState, useEffect } from "react";
import { Plus, Phone, CreditCard, Truck, X, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        bankName: "",
        accountNumber: "",
        priceTier1: "",
        priceTier2: "",
        priceTier3: ""
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = () => {
        fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact: supplier.contact,
            bankName: supplier.bankName,
            accountNumber: supplier.accountNumber,
            priceTier1: supplier.priceTier1.toString(),
            priceTier2: supplier.priceTier2.toString(),
            priceTier3: supplier.priceTier3.toString()
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus supplier ini?")) return;

        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus');
            fetchSuppliers();
        } catch (error) {
            alert("Gagal menghapus supplier.");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData({
            name: "",
            contact: "",
            bankName: "",
            accountNumber: "",
            priceTier1: "",
            priceTier2: "",
            priceTier3: ""
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSupplier) {
            // Update existing supplier
            await fetch(`/api/suppliers/${editingSupplier.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new supplier
            await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }

        handleCloseModal();
        fetchSuppliers();
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                            <Truck size={24} />
                        </div>
                        Data Supplier
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Kelola mitra dan rekanan pemasok barang.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={20} />
                    Supplier Baru
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <Building2 className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Belum ada supplier</h3>
                        <p className="text-slate-500 dark:text-slate-400">Tambahkan supplier pertama Anda.</p>
                    </div>
                ) : (
                    suppliers.map(supplier => (
                        <div key={supplier.id} className="glass-card group hover:scale-[1.02] transition-transform duration-300 relative flex flex-col h-full">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier.id)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{supplier.name}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        <Phone size={12} />
                                        <span>{supplier.contact || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800 mb-4" />

                            <div className="space-y-3 mt-auto">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <CreditCard size={18} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs uppercase font-bold text-slate-400 mb-0.5">{supplier.bankName || 'Bank Lain'}</p>
                                        <p className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                            {supplier.accountNumber || 'n/a'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-md"
                    onClick={handleCloseModal}
                >
                    <div
                        className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Building2 className="text-indigo-500" />
                                {editingSupplier ? 'Edit Supplier' : 'Supplier Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nama Supplier</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input-modern w-full"
                                    placeholder="PT. Maju Jaya"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Kontak (HP/Telp)</label>
                                <input
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    className="input-modern w-full"
                                    placeholder="0812..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nama Bank</label>
                                    <input
                                        placeholder="BCA/Mandiri"
                                        value={formData.bankName}
                                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        className="input-modern w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">No. Rekening</label>
                                    <input
                                        placeholder="123xxxxx"
                                        value={formData.accountNumber}
                                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="input-modern w-full font-mono"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <label className="text-sm font-bold text-amber-700 dark:text-amber-500 mb-2 block uppercase tracking-wide">Variasi Harga Beli (Per Kg)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Pilihan 1</label>
                                        <input
                                            type="number"
                                            placeholder="Rp"
                                            value={formData.priceTier1}
                                            onChange={e => setFormData({ ...formData, priceTier1: e.target.value })}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Pilihan 2</label>
                                        <input
                                            type="number"
                                            placeholder="Rp"
                                            value={formData.priceTier2}
                                            onChange={e => setFormData({ ...formData, priceTier2: e.target.value })}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Pilihan 3</label>
                                        <input
                                            type="number"
                                            placeholder="Rp"
                                            value={formData.priceTier3}
                                            onChange={e => setFormData({ ...formData, priceTier3: e.target.value })}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">Batal</button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editingSupplier ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
