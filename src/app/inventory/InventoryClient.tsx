"use client";

import { useState, Fragment } from "react";
import { Package, Plus, Search, Trash2, Edit, AlertTriangle, Box, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
    id: number;
    name: string;
    sku: string;
    type: string;
    category?: string;
    quantity: number;
    minStock: number;
    description: string | null;
    unit?: string;
}

interface BreakdownItem {
    name: string;
    total: number;
    count: number;
}

interface BreakdownData {
    suppliers: BreakdownItem[];
    warehouses: BreakdownItem[];
}

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Breakdown State
    const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
    const [breakdownData, setBreakdownData] = useState<BreakdownData>({ suppliers: [], warehouses: [] });
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);

    // Edit State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        category: "Barang Mentah",
        type: "Putusan",
        minStock: "10",
        description: "",
        quantity: "0"
    });

    const fetchProducts = async () => {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
    };

    const toggleBreakdown = async (productId: number) => {
        if (expandedProductId === productId) {
            setExpandedProductId(null);
            return;
        }

        setExpandedProductId(productId);
        setLoadingBreakdown(true);
        try {
            const res = await fetch(`/api/products/${productId}/breakdown`);
            const data = await res.json();
            setBreakdownData(data);
        } catch (err) {
            console.error("Failed to load breakdown");
        } finally {
            setLoadingBreakdown(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus barang ini? Berbahaya!")) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus');
            fetchProducts();
            toast.success("Barang berhasil dihapus");
        } catch (error) {
            toast.error("Gagal menghapus barang.");
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            category: product.category || "Barang Mentah",
            type: product.type,
            minStock: product.minStock.toString(),
            description: product.description || "",
            quantity: "0" // Quantity usually not editable directly here except for adjustment, forcing 0 safety
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ category: "Barang Mentah", type: "Putusan", minStock: "10", description: "", quantity: "0" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingProduct) {
                // UPDATE
                await fetch(`/api/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        minStock: parseFloat(formData.minStock),
                        description: formData.description
                    })
                });
            } else {
                // CREATE
                let name = formData.type;
                let sku = "";

                // SKU Logic based on Type
                if (formData.category === "Operasional" && formData.type === "Solar") {
                    sku = "SLR";
                } else if (formData.category === "Barang Jadi") {
                    if (formData.type === "Tepung Onggok") sku = "TP-ONG";
                    if (formData.type === "Tepung Putusan") sku = "TP-PTS";
                } else {
                    switch (formData.type) {
                        case "Putusan": sku = "PTS"; break;
                        case "Onggok": sku = "ONG"; break;
                        case "Gaplek": sku = "GPLK"; break;
                        default: sku = formData.type.toUpperCase().substring(0, 4);
                    }
                }

                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        sku: sku,
                        category: formData.category,
                        type: formData.type,
                        minStock: parseFloat(formData.minStock),
                        description: formData.description,
                        quantity: parseFloat(formData.quantity)
                    })
                });

                if (!res.ok) throw new Error("Gagal menyimpan data");
            }

            handleCloseModal();
            fetchProducts();
            toast.success("Data berhasil disimpan");
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesFilter = filter === "" || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getUnit = (type: string) => type === 'Solar' ? 'Liter' : 'Kg';

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-[color:rgb(var(--primary))] rounded-xl text-black shadow-lg shadow-[color:rgb(var(--primary))]/30">
                            <Package size={24} />
                        </div>
                        Stok Barang
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 ml-1">
                        Kelola data persediaan barang gudang.
                    </p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                    className="btn-primary"
                >
                    <Plus size={20} />
                    Tambah Barang
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="glass-card p-1 flex gap-1 overflow-x-auto">
                    {["", "Barang Mentah", "Barang Jadi", "Operasional"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                filter === cat
                                    ? "bg-black dark:bg-white text-white dark:text-black shadow-md font-bold"
                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                            )}
                        >
                            {cat === "" ? "Semua" : cat}
                        </button>
                    ))}
                </div>
                <div className="glass-card flex-1 flex items-center gap-4 py-2 px-4">
                    <Search className="text-slate-400" size={20} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama barang..."
                        className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            {/* Product Grid (Modern Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <Package className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Tidak ada barang</h3>
                        <p className="text-slate-500 dark:text-slate-400">Belum ada data barang yang sesuai.</p>
                    </div>
                ) : (
                    filteredProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="glass-card group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden flex flex-col h-full"
                        >
                            {/* Low Stock Indicator */}
                            {product.quantity <= product.minStock && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg z-20">
                                    LOW STOCK
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    product.category === 'Barang Jadi' ? "bg-green-100 dark:bg-green-900/20 text-green-600" :
                                        product.category === 'Operasional' ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600" :
                                            "bg-neutral-100 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400"
                                )}>
                                    <Box size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-[color:rgb(var(--primary))] transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4 flex-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 leading-snug">{product.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                                    {product.sku} • {product.category}
                                </p>
                                {product.description && (
                                    <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Stok</p>
                                    <p className={cn(
                                        "font-bold text-lg",
                                        product.quantity <= product.minStock ? "text-red-500" : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {product.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{getUnit(product.type)}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleBreakdown(product.id)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all text-left relative overflow-hidden",
                                        expandedProductId === product.id
                                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                            : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-amber-300"
                                    )}
                                >
                                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Detail</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Riwayat</span>
                                        {expandedProductId === product.id ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-neutral-400" />}
                                    </div>
                                </button>
                            </div>

                            {/* Breakdown Panel */}
                            {expandedProductId === product.id && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                    {loadingBreakdown ? (
                                        <div className="text-center py-2"><Loader2 className="animate-spin inline text-indigo-500" size={16} /></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {breakdownData.suppliers.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Supplier</p>
                                                    <div className="space-y-1">
                                                        {breakdownData.suppliers.map((s, i) => (
                                                            <div key={i} className="flex justify-between text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded">
                                                                <span className="text-slate-700 dark:text-slate-300">{s.name}</span>
                                                                <span className="font-mono font-bold">{s.total.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {breakdownData.suppliers.length === 0 && <p className="text-xs text-slate-400 italic text-center">Tidak ada riwayat supplier</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    {editingProduct ? 'Edit Barang' : 'Tambah Barang Baru'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Kategori</label>
                                    <select
                                        className="input-modern w-full"
                                        value={formData.category}
                                        onChange={e => {
                                            const cat = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                category: cat,
                                                type: cat === "Operasional" ? "Solar" : cat === "Barang Jadi" ? "Tepung Onggok" : "Putusan"
                                            }));
                                        }}
                                        disabled={!!editingProduct}
                                    >
                                        <option value="Barang Mentah">Barang Mentah</option>
                                        <option value="Barang Jadi">Barang Jadi</option>
                                        <option value="Operasional">Operasional</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Jenis Barang</label>
                                    <select
                                        className="input-modern w-full"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        disabled={!!editingProduct}
                                    >
                                        {formData.category === "Barang Mentah" && (
                                            <>
                                                <option value="Putusan">Putusan</option>
                                                <option value="Onggok">Onggok</option>
                                                <option value="Gaplek">Gaplek</option>
                                                <option value="Lainnya">Lainnya</option>
                                            </>
                                        )}
                                        {formData.category === "Barang Jadi" && (
                                            <>
                                                <option value="Tepung Onggok">Tepung Onggok</option>
                                                <option value="Tepung Putusan">Tepung Putusan</option>
                                            </>
                                        )}
                                        {formData.category === "Operasional" && <option value="Solar">Solar</option>}
                                    </select>
                                </div>

                                {!editingProduct && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Stok Awal</label>
                                        <input
                                            type="number"
                                            className="input-modern w-full font-bold"
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Min. Stok (Alert)</label>
                                    <input
                                        type="number"
                                        className="input-modern w-full"
                                        value={formData.minStock}
                                        onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Keterangan</label>
                                    <textarea
                                        className="input-modern w-full h-20 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                        disabled={loading}
                                        className="btn-primary flex-1"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : (editingProduct ? "Update" : "Simpan")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
