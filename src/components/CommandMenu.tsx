"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    LayoutDashboard,
    Package,
    Factory,
    Sun,
    Moon,
    Search,
    Truck,
    Users,
    Wallet,
    LogOut,
    ArrowDownLeft,
    ArrowUpRight,
    BarChart3,
    Tv,
    ShieldAlert
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function CommandMenu({ user }: { user?: { name: string, role: string } }) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const { setTheme } = useTheme();

    const role = user?.role || "GUEST";
    const isOwner = role === 'OWNER';

    // Helper to check access
    const hasAccess = (path: string) => {
        if (isOwner) return true;
        // Staff allowed paths
        const staffAllowed = ['/daily-log', '/production-report', '/attendance', '/'];
        return staffAllowed.includes(path);
    };

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <div className="w-full max-w-lg bg-white dark:bg-black rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
                <Command className="w-full">
                    <div className="flex items-center border-b border-neutral-100 dark:border-neutral-800 px-4 py-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-neutral-500" />
                        <Command.Input
                            placeholder="Ketik perintah atau cari menu..."
                            className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-neutral-500 text-neutral-800 dark:text-neutral-100"
                        />
                    </div>

                    <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                        <Command.Empty className="py-6 text-center text-sm text-neutral-500">
                            Tidak ada hasil ditemukan.
                        </Command.Empty>

                        <Command.Group heading="Utama" className="text-xs font-bold text-neutral-500 mb-2 px-2 uppercase tracking-wide">
                            {hasAccess('/') && (
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/dashboard"))}
                                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                    value="dashboard home beranda"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Command.Item>
                            )}

                            {hasAccess('/inventory') && (
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/inventory"))}
                                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                    value="stok inventory barang gudang"
                                >
                                    <Package className="h-4 w-4" />
                                    <span>Stok Barang</span>
                                </Command.Item>
                            )}

                            {hasAccess('/daily-log') && (
                                <Command.Item
                                    onSelect={() => runCommand(() => router.push("/daily-log"))}
                                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                    value="produksi input harian laporan"
                                >
                                    <Factory className="h-4 w-4" />
                                    <span>Input Produksi</span>
                                </Command.Item>
                            )}
                        </Command.Group>

                        {/* Logistik & Transaksi Group - Only show if has access to AT LEAST ONE item in this group */}
                        {(hasAccess('/transactions') || hasAccess('/inbound') || hasAccess('/outbound') || hasAccess('/suppliers')) && (
                            <Command.Group heading="Logistik & Transaksi" className="text-xs font-bold text-neutral-500 mb-2 px-2 uppercase tracking-wide">
                                {hasAccess('/transactions') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/transactions"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="transaksi riwayat barang masuk keluar"
                                    >
                                        <Truck className="h-4 w-4" />
                                        <span>Riwayat Transaksi</span>
                                    </Command.Item>
                                )}
                                {hasAccess('/inbound') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/inbound"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="inbound masuk tambah stok"
                                    >
                                        <ArrowDownLeft className="h-4 w-4" />
                                        <span>Barang Masuk</span>
                                    </Command.Item>
                                )}
                                {hasAccess('/outbound') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/outbound"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="outbound keluar kurangi stok"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                        <span>Barang Keluar</span>
                                    </Command.Item>
                                )}
                                {hasAccess('/suppliers') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/suppliers"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="supplier pemasok vendor"
                                    >
                                        <Truck className="h-4 w-4" />
                                        <span>Data Supplier</span>
                                    </Command.Item>
                                )}
                            </Command.Group>
                        )}

                        {/* Manajemen Group */}
                        {(hasAccess('/cashflow') || hasAccess('/production-report') || hasAccess('/attendance') || hasAccess('/monitoring') || hasAccess('/audit-logs')) && (
                            <Command.Group heading="Manajemen" className="text-xs font-bold text-neutral-500 mb-2 px-2 uppercase tracking-wide">
                                {hasAccess('/cashflow') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/cashflow"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="keuangan cashflow kas"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        <span>Keuangan (Cashflow)</span>
                                    </Command.Item>
                                )}

                                {hasAccess('/production-report') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/production-report"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="laporan report produksi grafik"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        <span>Laporan Produksi</span>
                                    </Command.Item>
                                )}

                                {hasAccess('/attendance') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/attendance"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="absensi karyawan kehadiran"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>Absensi Karyawan</span>
                                    </Command.Item>
                                )}

                                {hasAccess('/monitoring') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/monitoring"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="cctv monitoring kamera"
                                    >
                                        <Tv className="h-4 w-4" />
                                        <span>Monitoring CCTV</span>
                                    </Command.Item>
                                )}

                                {hasAccess('/audit-logs') && (
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push("/audit-logs"))}
                                        className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                        value="audit log security"
                                    >
                                        <ShieldAlert className="h-4 w-4" />
                                        <span>Audit System</span>
                                    </Command.Item>
                                )}
                            </Command.Group>
                        )}

                        <Command.Separator className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2 my-2" />

                        <Command.Group heading="Pengaturan" className="text-xs font-bold text-neutral-500 mb-2 px-2 uppercase tracking-wide">
                            <Command.Item
                                onSelect={() => runCommand(() => setTheme("light"))}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                value="tema theme light terang"
                            >
                                <Sun className="h-4 w-4" />
                                <span>Mode Terang</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => setTheme("dark"))}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 aria-selected:bg-amber-50 dark:aria-selected:bg-amber-900/30 aria-selected:text-amber-600 dark:aria-selected:text-amber-400 transition-colors"
                                value="tema theme dark gelap"
                            >
                                <Moon className="h-4 w-4" />
                                <span>Mode Gelap</span>
                            </Command.Item>
                            <Command.Separator className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2 my-2" />
                            <Command.Item
                                onSelect={() => runCommand(handleLogout)}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20 transition-colors"
                                value="logout keluar signout"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Keluar Aplikasi</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    <div className="border-t border-neutral-100 dark:border-neutral-800 p-2 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] text-neutral-400 flex justify-between px-4">
                        <span>Navigasi dengan ↑↓, Enter untuk pilih</span>
                        <span>Press Esc to close</span>
                    </div>
                </Command>
            </div>
        </div>
    );
}
