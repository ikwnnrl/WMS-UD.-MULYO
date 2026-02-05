import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
    try {
        const { username, pin } = await request.json();

        // 1. Check Owner/Admin User Table
        const user = await prisma.user.findUnique({
            where: { username }
        });

        let sessionUser = null;

        if (user && user.pin === pin) {
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

            if (employee && (employee as any).pin === pin && employee.isActive) {
                sessionUser = {
                    id: employee.id,
                    username: employee.name, // Use name as username
                    name: employee.name,
                    role: 'STAFF'
                };
            }
        }

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
