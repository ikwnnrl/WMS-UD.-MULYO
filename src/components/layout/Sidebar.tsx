
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Package,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Truck,
    Factory,
    Users,
    FileText,
    Tv,
    LogOut,
    ShieldAlert,
    LayoutGrid,
    ChevronLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
    { href: "/", label: "Dashboard", icon: LayoutGrid },
    { href: "/inventory", label: "Stok Barang", icon: Package },
    { href: "/suppliers", label: "Supplier", icon: Truck },
    { href: "/inbound", label: "Barang Masuk", icon: ArrowDownLeft },
    { href: "/outbound", label: "Barang Keluar", icon: ArrowUpRight },
    { href: "/transactions", label: "Log Stok", icon: FileText },
    { href: "/daily-log", label: "Input Produksi", icon: Factory },
    { href: "/production-report", label: "Laporan", icon: BarChart3 },
    { href: "/cashflow", label: "Cash Flow", icon: Wallet },
    { href: "/monitoring", label: "CCTV", icon: Tv },
    { href: "/attendance", label: "Absensi", icon: Users },
    { href: "/attendance/employee-history", label: "Riwayat", icon: Users },
    { href: "/audit-logs", label: "Audit", icon: ShieldAlert },
];

export function Sidebar({ user }: { user?: { name: string, role: string } }) {
    const pathname = usePathname();
    const router = useRouter();
    const role = user?.role || "GUEST";

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    const isOwner = role === 'OWNER';

    // Grouping links for clearer navigation
    const filteredLinks = links.filter(link => {
        if (isOwner) return true;
        const staffAllowed = ['/daily-log', '/production-report', '/attendance', '/'];
        return staffAllowed.includes(link.href);
    });

    return (
        <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-64 flex-col z-50">
            {/* Glass Container */}
            <div className="flex-1 rounded-[2rem] bg-black/95 dark:bg-black/90 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">

                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-amber-500/30">
                            M
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white tracking-tight">UD. Mulyo</h1>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Warehouse v2.0</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-1">
                    {/* Section Label */}
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Menu Utama</div>

                    {filteredLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
                                    isActive
                                        ? "bg-[color:rgb(var(--primary))] text-black shadow-lg shadow-[color:rgb(var(--primary))]/20 font-bold"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon size={18} className={cn("transition-transform group-hover:scale-110", isActive && "text-black")} />
                                <span>{link.label}</span>

                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-glow animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
                    {user && (
                        <div className="flex items-center gap-3 px-2 mb-4">
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-inner",
                                isOwner ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-black" : "bg-gradient-to-br from-neutral-700 to-neutral-800"
                            )}>
                                {user.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate leading-none mb-1">{user.name}</p>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold border",
                                    isOwner
                                        ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                                        : "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
                                )}>
                                    {role}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                            title="Keluar"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
