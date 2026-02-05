import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
    try {
        const attendance = await prisma.attendance.findMany({
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(attendance);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wms_session");
        if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = JSON.parse(sessionCookie.value);

        const body = await request.json();

        // Ensure date is properly formatted or taken as is (assuming YYYY-MM-DD passed or current date)
        const dateObj = body.date ? new Date(body.date) : new Date();
        const { date, totalPresent, totalAbsent, absentList, notes, details } = body;

        // Calculate Meal Allowance based on details (Advanced Logic)
        let calculatedMealAllowance = 0;
        if (details) {
            try {
                const detailsMap = JSON.parse(details);
                Object.values(detailsMap).forEach((val: any) => {
                    const status = (typeof val === 'object' && val !== null) ? val.status : val;
                    if (status === 'PRESENT') calculatedMealAllowance += 25000;
                    else if (status === 'HALF_DAY') calculatedMealAllowance += 12500;
                    // PERMIT, ALPHA, SICK = 0
                });
            } catch (e) {
                calculatedMealAllowance = totalPresent * 25000; // Fallback
            }
        } else {
            calculatedMealAllowance = totalPresent * 25000;
        }

        const attendance = await prisma.attendance.create({
            data: {
                date: new Date(date),
                totalPresent,
                totalAbsent,
                totalMealAllowance: calculatedMealAllowance,
                absentList: typeof absentList === 'string' ? absentList : JSON.stringify(absentList),
                details: details || JSON.stringify({}),
                notes,
            },
        });

        // Create CashFlow Expense for Meal Allowance
        if (calculatedMealAllowance > 0) {
            await prisma.cashFlow.create({
                data: {
                    type: 'EXPENSE',
                    amount: calculatedMealAllowance,
                    category: 'Konsumsi',
                    description: `Uang Makan Harian (${new Date(date).toLocaleDateString('id-ID')}) [REF:ATT-${attendance.id}]`,
                    date: new Date(date),
                }
            });
        }

        // AUDIT LOG
        await createAuditLog('CREATE', 'Attendance', attendance.id, `Created attendance for ${new Date(date).toLocaleDateString('id-ID')}`, user);

        return NextResponse.json(attendance);
    } catch (error: any) {
        console.error("Attendance POST Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create attendance" }, { status: 500 });
    }
}
