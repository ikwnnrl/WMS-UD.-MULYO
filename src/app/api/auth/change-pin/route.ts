import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { verifyPin, hashPin } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { username, oldPin, newPin, roleType } = await request.json();

        if (!newPin || newPin.length < 4) {
            return NextResponse.json({ error: "PIN baru minimal 4 digit." }, { status: 400 });
        }

        let isUpdated = false;
        let userIdForLog = null;
        let userRoleForLog = "";
        const newPinHashed = await hashPin(newPin);

        // 1. Handle STAFF (Employee Table)
        if (roleType === 'STAFF') {
            const employee = await prisma.employee.findFirst({
                where: { name: username }
            });

            if (!employee) {
                return NextResponse.json({ error: "Karyawan tidak ditemukan." }, { status: 404 });
            }

            // Verify Old PIN (supports both bcrypt hash and legacy plaintext)
            if (!(await verifyPin(oldPin, (employee as any).pin))) {
                return NextResponse.json({ error: "PIN Lama salah." }, { status: 401 });
            }

            // Update with hashed PIN
            await prisma.employee.update({
                where: { id: employee.id },
                data: { pin: newPinHashed }
            });

            isUpdated = true;
            userIdForLog = employee.id;
            userRoleForLog = 'STAFF';
        }
        // 2. Handle OWNER / DRIVER (User Table)
        else {
            const user = await prisma.user.findUnique({
                where: { username: username }
            });

            if (!user) {
                return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
            }

            if (!(await verifyPin(oldPin, user.pin))) {
                return NextResponse.json({ error: "PIN Lama salah." }, { status: 401 });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { pin: newPinHashed }
            });

            isUpdated = true;
            userIdForLog = user.id;
            userRoleForLog = user.role;
        }

        if (isUpdated) {
            await createAuditLog('UPDATE', 'Auth', userIdForLog, `User ${username} changed PIN`, { username: username, role: userRoleForLog });
            return NextResponse.json({ success: true, message: "PIN berhasil diubah." });
        }

        return NextResponse.json({ error: "Gagal mengubah PIN." }, { status: 500 });

    } catch (error) {
        console.error("Change PIN Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
    }
}
