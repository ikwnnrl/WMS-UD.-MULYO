
import { PrismaClient } from "@prisma/client";
import {
    Package,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    ChevronRight,
    Search
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ProductionTrendChart from "@/components/charts/ProductionChartWrapper";

// Initialize Prisma
const prisma = new PrismaClient();

async function getStats() {
    const totalProducts = await prisma.product.count();

    // Manual low stock check
    const products = await prisma.product.findMany();
    const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

    const recentTransactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { product: true }
    });

    // Top Products (Outbound)
    const outboundTx = await prisma.transaction.findMany({
        where: { type: 'OUT' },
        include: { product: true }
    });

    const productSales: Record<string, number> = {};
    outboundTx.forEach(tx => {
        if (!productSales[tx.product.name]) productSales[tx.product.name] = 0;
        productSales[tx.product.name] += tx.quantity;
    });

    const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, total]) => ({ name, total }));

    // Chart Data (Last 14 Days)
    const logs = await prisma.productionLog.findMany({
        take: 14,
        orderBy: { date: 'desc' }
    });

    const chartData = logs.reverse().map(log => ({
        date: new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        tepung: log.finishedGoodQty,
        solar: log.solarQty
    }));

    return { totalProducts, lowStockCount, recentTransactions, topProducts, chartData };
}

import CurrentDate from "@/components/common/CurrentDate";

export default async function Dashboard() {
    const { totalProducts, lowStockCount, recentTransactions, topProducts, chartData } = await getStats();

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-200">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Ringkasan aktivitas dan performa gudang hari ini.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Calendar size={16} />
                        <CurrentDate />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Products */}
                <div className="glass-card hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <Package size={100} />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                            <Package size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Item</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalProducts}</h3>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className={cn(
                    "glass-card hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors group relative overflow-hidden",
                    lowStockCount > 0 && "ring-2 ring-red-500/50 shadow-red-500/10"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <AlertTriangle size={100} />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl",
                            lowStockCount > 0
                                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse"
                                : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        )}>
                            {lowStockCount > 0 ? <AlertTriangle size={28} /> : <Activity size={28} />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stok Menipis</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{lowStockCount}</h3>
                                {lowStockCount > 0 && <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">ACTION NEEDED</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Sales */}
                <div className="glass-card hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Terlaris</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 truncate w-40">
                                {topProducts[0]?.name || '-'}
                            </h3>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                {topProducts[0]?.total.toLocaleString() || 0} Kg <span className="text-slate-400 font-normal">terjual</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="glass-card">
                <ProductionTrendChart data={chartData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products List */}
                <div className="glass-card flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                                <TrendingUp size={18} />
                            </div>
                            Top Produk (Keluar)
                        </h3>
                    </div>

                    <div className="space-y-4 flex-1">
                        {topProducts.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Belum ada data penjualan</div>
                        ) : (
                            topProducts.map((p, i) => (
                                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all group-hover:scale-110",
                                            i === 0 ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30" :
                                                i === 1 ? "bg-slate-300 text-slate-700" :
                                                    "bg-orange-700/60 text-white"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 w-32 relative overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-amber-500 rounded-full"
                                                    style={{ width: `${(p.total / (topProducts[0]?.total || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold font-mono text-slate-700 dark:text-slate-200">{p.total.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="glass-card flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                                <Activity size={18} />
                            </div>
                            Transaksi Terakhir
                        </h3>
                        <Link href="/transactions" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 group">
                            LIHAT SEMUA <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">Belum ada transaksi.</div>
                        ) : (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="p-3 flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-2.5 rounded-xl transition-colors",
                                            tx.type === 'IN'
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40"
                                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40"
                                        )}>
                                            {tx.type === 'IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{tx.product.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} •
                                                <span className="opacity-75 font-normal ml-1">{tx.driverName || 'No Driver'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "font-bold font-mono text-sm block",
                                            tx.type === 'IN' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                        )}>
                                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kg</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
