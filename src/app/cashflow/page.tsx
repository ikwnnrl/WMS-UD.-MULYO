
"use client";

import { useState, useEffect } from "react";
import {
    Plus, Wallet, TrendingUp, TrendingDown, X, Pencil, Trash2,
    Truck, Factory, Building2, HelpCircle, Layers, Landmark, UserCircle,
    PieChart as PieChartIcon, LayoutDashboard, List, Calendar
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface CashFlow {
    id: number;
    type: string;
    amount: number;
    category: string;
    group: string; // 'PRODUCTION', 'OPERATIONAL', 'TRANSPORT', 'OTHER'
    description: string;
    date: string;
}

const GROUPS = [
    { id: 'PRODUCTION', label: 'Produksi', icon: Factory, color: '#EF4444' }, // Red
    { id: 'MATERIALS', label: 'Bahan Baku', icon: Layers, color: '#8B5CF6' }, // Violet
    { id: 'OPERATIONAL', label: 'Operasional', icon: Building2, color: '#3B82F6' }, // Blue
    { id: 'TRANSPORT', label: 'Transportasi', icon: Truck, color: '#F59E0B' }, // Orange
    { id: 'OBLIGATIONS', label: 'Kewajiban', icon: Landmark, color: '#6366F1' }, // Indigo
    { id: 'PRIVE', label: 'Prive Owner', icon: UserCircle, color: '#EC4899' }, // Pink
    { id: 'OTHER', label: 'Lainnya', icon: HelpCircle, color: '#10B981' } // Green
];

const CATEGORIES: Record<string, string[]> = {
    'PRODUCTION': ['Sparepart Mesin', 'Karung/Kemasan', 'Upah Borongan', 'Maintenance Pabrik', 'Oli Mesin'],
    'MATERIALS': ['Beli Singkong', 'Beli Onggok Basah', 'Bongkar Muat', 'Karung Bekas'],
    'OPERATIONAL': ['Listrik & Air', 'Gaji Karyawan', 'Sewa Tempat', 'Konsumsi', 'ATK & Internet', 'Kebersihan', 'Keamanan', 'Solar Genset'],
    'TRANSPORT': ['BBM Kendaraan', 'Service & Maintenance', 'Ganti Oli/Ban', 'Pajak Kendaraan', 'Uang Jalan', 'Sewa Truk'],
    'OBLIGATIONS': ['Cicilan Bank', 'Bayar Hutang', 'Pajak Usaha', 'BPJS'],
    'PRIVE': ['Ambilan Pribadi', 'Keperluan Rumah', 'Sekolah Anak'],
    'OTHER': ['Sumbangan', 'Sosial', 'Biaya Tak Terduga', 'Lainnya']
};

export default function CashFlowPage() {
    const [flows, setFlows] = useState<CashFlow[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');

    // Filter State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Edit State
    const [editingFlow, setEditingFlow] = useState<CashFlow | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        type: "EXPENSE",
        amount: "",
        group: "OPERATIONAL",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    // Calculator State (Restored)
    const [calcWeight, setCalcWeight] = useState("");
    const [calcPrice, setCalcPrice] = useState("");

    // Auto-calculate amount when weight or price changes (Restored)
    useEffect(() => {
        if (formData.type === 'INCOME' && calcWeight && calcPrice) {
            const weight = parseFloat(calcWeight) || 0;
            const price = parseFloat(calcPrice) || 0;
            const total = weight * price;

            if (weight > 0 && price > 0) {
                setFormData(prev => ({
                    ...prev,
                    amount: total.toString(),
                    description: `Penjualan ${weight.toLocaleString()} Kg @ Rp ${price.toLocaleString()}`
                }));
            }
        }
    }, [calcWeight, calcPrice, formData.type]);

    useEffect(() => {
        fetchCashFlows();
    }, []);

    const fetchCashFlows = () => {
        fetch('/api/cashflow').then(res => res.json()).then(setFlows);
    };

    // Filtered Data
    const filteredFlows = flows.filter(flow => {
        const d = new Date(flow.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Stats Computation
    const totalIncome = filteredFlows.filter(f => f.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = filteredFlows.filter(f => f.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = flows.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0);

    // Breakdown Data for Chart
    const breakdownData = GROUPS.map(g => ({
        name: g.label,
        value: filteredFlows.filter(f => f.type === 'EXPENSE' && (f.group === g.id || (!f.group && g.id === 'OPERATIONAL'))).reduce((acc, curr) => acc + curr.amount, 0),
        color: g.color
    })).filter(d => d.value > 0);

    // Form Handlers
    const handleOpenModal = () => {
        setEditingFlow(null);
        setFormData({
            type: "EXPENSE",
            amount: "",
            group: "OPERATIONAL",
            category: CATEGORIES['OPERATIONAL'][0],
            description: "",
            date: new Date().toISOString().split('T')[0]
        });
        setCalcWeight("");
        setCalcPrice("");
        setIsModalOpen(true);
    };

    const handleEdit = (flow: CashFlow) => {
        setEditingFlow(flow);
        const currentGroup = flow.group || 'OPERATIONAL';
        setFormData({
            type: flow.type,
            amount: flow.amount.toString(),
            group: currentGroup,
            category: flow.category,
            description: flow.description || "",
            date: new Date(flow.date).toISOString().split('T')[0]
        });
        setCalcWeight("");
        setCalcPrice("");
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus data ini?")) return;
        try {
            await fetch(`/api/cashflow/${id}`, { method: 'DELETE' });
            fetchCashFlows();
        } catch (err) { alert("Gagal hapus"); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingFlow ? `/api/cashflow/${editingFlow.id}` : '/api/cashflow';
            const method = editingFlow ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            setIsModalOpen(false);
            fetchCashFlows();
        } catch (err) { alert('Gagal simpan'); }
    };

    // Helper to get group details
    const getGroupDetails = (groupId: string) => GROUPS.find(g => g.id === (groupId || 'OPERATIONAL')) || GROUPS[1];

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[var(--radius-lg)] shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Wallet className="text-blue-600" />
                        Cash Flow Manager
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Sistem "Amplop Pintar" untuk analisa biaya operasional.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Month Picker */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 items-center">
                        <Calendar size={16} className="ml-2 text-slate-400" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-medium px-2 py-1.5 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                            {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-medium px-2 py-1.5 outline-none text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Catat Baru
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-[var(--radius-lg)] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet size={100} />
                    </div>
                    <p className="text-blue-100 font-medium mb-1">Saldo Saat Ini</p>
                    <h2 className="text-4xl font-bold tracking-tight">Rp {currentBalance.toLocaleString()}</h2>
                </div>
                <div className="glass-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pemasukan (Bulan Ini)</p>
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">+ Rp {totalIncome.toLocaleString()}</h2>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                        <TrendingUp size={24} />
                    </div>
                </div>
                <div className="glass-card flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pengeluaran (Bulan Ini)</p>
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">- Rp {totalExpense.toLocaleString()}</h2>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                        <TrendingDown size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Chart & Analysis */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Cost Breakdown Chart */}
                    <div className="glass-card">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-slate-400" />
                            Analisa Biaya
                        </h3>

                        {breakdownData.length > 0 ? (
                            <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={breakdownData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {breakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `Rp ${value.toLocaleString()}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400">Total Biaya</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rp {totalExpense.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                Belum ada data pengeluaran
                            </div>
                        )}
                    </div>

                    {/* Quick Stats by Group */}
                    <div className="space-y-3">
                        {GROUPS.map(group => {
                            const groupTotal = filteredFlows
                                .filter(f => f.type === 'EXPENSE' && (f.group === group.id || (!f.group && group.id === 'OPERATIONAL')))
                                .reduce((acc, curr) => acc + curr.amount, 0);

                            if (groupTotal === 0) return null;

                            return (
                                <div key={group.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${group.color}20`, color: group.color }}>
                                            <group.icon size={18} />
                                        </div>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{group.label}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">Rp {groupTotal.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Col: Transaction List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700')}
                            >
                                <LayoutDashboard size={16} className="inline mr-2" />
                                Card View
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700')}
                            >
                                <List size={16} className="inline mr-2" />
                                Table View
                            </button>
                        </div>
                        <span className="text-xs text-slate-400 px-4">
                            {filteredFlows.length} Transaksi
                        </span>
                    </div>

                    {/* Transactions */}
                    <div className="space-y-3">
                        {filteredFlows.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 glass-card">
                                <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Belum ada transaksi bulan ini</p>
                            </div>
                        ) : (
                            filteredFlows.map(flow => {
                                const groupInfo = getGroupDetails(flow.group);
                                return (
                                    <div
                                        key={flow.id}
                                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                {/* Icon Box */}
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${flow.type === 'INCOME' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}`}
                                                    style={flow.type === 'EXPENSE' ? { backgroundColor: `${groupInfo.color}20`, color: groupInfo.color } : {}}
                                                >
                                                    {flow.type === 'INCOME' ? <TrendingUp size={24} /> : <groupInfo.icon size={24} />}
                                                </div>

                                                {/* Content */}
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{flow.category}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{flow.description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                            {flow.group || 'OPERATIONAL'}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(flow.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount & Actions */}
                                            <div className="text-right">
                                                <div className={cn("text-lg font-bold font-mono", flow.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100')}>
                                                    {flow.type === 'INCOME' ? '+' : '-'} Rp {flow.amount.toLocaleString()}
                                                </div>
                                                <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(flow)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500"><Pencil size={14} /></button>
                                                    <button onClick={() => handleDelete(flow.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-card w-full max-w-lg animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {editingFlow ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'INCOME', group: 'OPERATIONAL', category: 'Penjualan Tepung Onggok' })}
                                    className={cn("py-2 rounded-lg font-bold text-sm transition-all", formData.type === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500')}
                                >
                                    Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                    className={cn("py-2 rounded-lg font-bold text-sm transition-all", formData.type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400' : 'text-slate-500')}
                                >
                                    Pengeluaran
                                </button>
                            </div>

                            {/* Group Selection (Only for Expense) */}
                            {formData.type === 'EXPENSE' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pilih Amplop (Kelompok)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {GROUPS.map(g => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, group: g.id, category: CATEGORIES[g.id][0] })}
                                                className={cn(
                                                    "p-3 rounded-xl border flex items-center gap-3 transition-all text-left",
                                                    formData.group === g.id
                                                        ? `border-${g.color.replace('#', '')} bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20`
                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                )}
                                            >
                                                <div className="p-2 rounded-full text-white" style={{ backgroundColor: g.color }}>
                                                    <g.icon size={16} />
                                                </div>
                                                <span className={cn("text-sm font-bold", formData.group === g.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500')}>{g.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SALES CALCULATOR (Restored for INCOME) */}
                            {formData.type === 'INCOME' && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 space-y-3">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <TrendingUp size={16} />
                                        <h3 className="text-xs font-bold uppercase tracking-wide">Kalkulator Penjualan</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Berat (Kg)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="input-modern w-full"
                                                value={calcWeight}
                                                onChange={(e) => setCalcWeight(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Harga (Rp)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="input-modern w-full"
                                                value={calcPrice}
                                                onChange={(e) => setCalcPrice(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="input-modern w-full"
                                    >
                                        {formData.type === 'INCOME' ? (
                                            <>
                                                <option>Penjualan Tepung Onggok</option>
                                                <option>Penjualan Tepung Putusan</option>
                                                <option>Pemasukan Lain</option>
                                            </>
                                        ) : (
                                            CATEGORIES[formData.group || 'OPERATIONAL']?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="input-modern w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="input-modern w-full text-lg font-bold"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input-modern w-full h-20 resize-none"
                                    placeholder="Catatan tambahan..."
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full shadow-lg shadow-indigo-500/20">
                                {editingFlow ? 'Update Transaksi' : 'Simpan Transaksi'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
