"use client";

import { LayoutGrid, Package, PlusCircle, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CommandMenu } from "@/components/CommandMenu";
import { useState, useEffect } from "react";

export function MobileNav({ user }: { user?: { name: string, role: string } }) {
    const pathname = usePathname();

    const role = user?.role || "GUEST";
    const isOwner = role === 'OWNER';

    // Trigger for command menu (simulate Ctrl+K)
    const openMenu = () => {
        const event = new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
            bubbles: true
        });
        document.dispatchEvent(event);
    };

    const allNavItems = [
        { href: "/", label: "Home", icon: LayoutGrid },
        { href: "/inventory", label: "Stok", icon: Package },
        { href: "/daily-log", label: "Input", icon: PlusCircle },
    ];

    const filteredNavItems = allNavItems.filter(item => {
        if (isOwner) return true;

        // Staff & Driver logic
        const allowed = ['/daily-log', '/production-report', '/attendance', '/'];
        return allowed.includes(item.href);
    });

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 pb-safe">
            <div className="flex justify-around items-center h-16">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive
                                    ? "text-[color:rgb(var(--primary))] dark:text-[color:rgb(var(--primary))]"
                                    : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                            )}
                        >
                            <Icon size={20} className={cn(isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Menu Button (Trigger Command Palette) */}
                <button
                    onClick={openMenu}
                    className="flex flex-col items-center justify-center w-full h-full gap-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>
        </div>
    );
}
