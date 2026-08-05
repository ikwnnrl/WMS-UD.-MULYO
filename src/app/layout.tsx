import AuthGuard from "@/components/AuthGuard";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { CommandMenu } from "@/components/CommandMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CV. Bumi Mulia Lestari WMS",
    description: "Warehouse Management System",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("wms_session")?.value;

    let sessionObj = null;
    let userRole = "GUEST";

    try {
        if (sessionCookie) {
            sessionObj = JSON.parse(sessionCookie);
            userRole = sessionObj.role;
        }
    } catch (e) {
        userRole = "GUEST";
    }

    return (
        <html lang="id" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthGuard session={sessionObj}>
                        {userRole !== "GUEST" && (
                            <>
                                <Sidebar user={sessionObj} />
                                <MobileNav user={sessionObj} />
                            </>
                        )}
                        <main className={userRole !== "GUEST" ? "flex-1 md:ml-[280px] min-h-screen p-4 md:p-8 pb-24 md:pb-8" : "flex-1 min-h-screen p-8"}>
                            {children}
                        </main>
                    </AuthGuard>
                    <Toaster position="top-right" richColors closeButton />
                    <CommandMenu user={sessionObj} />
                </ThemeProvider>
            </body>
        </html>
    );
}
