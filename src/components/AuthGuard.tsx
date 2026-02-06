"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({
    children,
    session
}: {
    children: React.ReactNode;
    session: any
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. If NOT logged in (no session)
        if (!session) {
            // Allow login page
            if (pathname === "/login") return;
            // Otherwise redirect to login
            router.push("/login");
            return;
        }

        // 2. If logged in
        if (session) {
            // Redirect away from login page
            if (pathname === "/login") {
                router.push("/");
                return;
            }

            // Restrict Staff & Driver Access
            if (session.role !== 'OWNER') {
                // List of allowed paths (prefixes)
                const allowedPrefixes = [
                    '/daily-log',
                    '/production-report',
                    '/attendance'
                ];

                // Allow exact match for Dashboard '/' or prefix match for others
                const isAllowed = pathname === '/' || allowedPrefixes.some(prefix => pathname.startsWith(prefix));

                if (!isAllowed) {
                    router.push('/');
                    // Optional: alert can be annoying on every redirect, maybe toast used later
                }
            }
        }
    }, [pathname, session, router]);

    // If redirecting, we could show a loader, but for now just render children
    // (A slight flash might occur, but it's acceptable for this fix)
    return <>{children}</>;
}
