import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { verifyPin, checkLockout, recordLoginAttempt } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { username, pin } = await request.json();

        if (!username || !pin) {
            return NextResponse.json({ error: "Username dan PIN wajib diisi." }, { status: 400 });
        }

        // Rate-limit check: block brute-force attempts on this username
        const lockoutSeconds = await checkLockout(username);
        if (lockoutSeconds > 0) {
            const minutes = Math.ceil(lockoutSeconds / 60);
            return NextResponse.json(
                { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.` },
                { status: 429 }
            );
        }

        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined;

        // 1. Check Owner/Admin User Table
        const user = await prisma.user.findUnique({
            where: { username }
        });

        let sessionUser = null;

        if (user && (await verifyPin(pin, user.pin))) {
            sessionUser = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            };
        } else if (!user) {
            // 2. Check Employee Table (Staff)
            // Note: Employee names are not unique by constraint but handled as such for login here
            const employee = await prisma.employee.findFirst({
                where: { name: username }
            });

            if (employee && employee.isActive && (await verifyPin(pin, (employee as any).pin))) {
                sessionUser = {
                    id: employee.id,
                    username: employee.name, // Use name as username
                    name: employee.name,
                    role: 'STAFF'
                };
            }
        }

        // Record the attempt for rate-limiting (fire-and-forget style, but awaited to keep it simple)
        await recordLoginAttempt(username, !!sessionUser, ipAddress);

        if (!sessionUser) {
            return NextResponse.json({ error: "Username atau PIN salah" }, { status: 401 });
        }

        // Create Session Cookie
        const sessionData = JSON.stringify(sessionUser);

        const cookieStore = await cookies();
        cookieStore.set("wms_session", sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // AUDIT LOG
        await createAuditLog('LOGIN', 'Auth', sessionUser.id, `User ${sessionUser.username} logged in`, { username: sessionUser.username, role: sessionUser.role });

        return NextResponse.json({ success: true, user: { name: sessionUser.name, role: sessionUser.role } });
    } catch (error) {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
