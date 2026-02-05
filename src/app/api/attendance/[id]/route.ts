
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const attendanceId = parseInt(id);
        const body = await request.json();

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
                });
            } catch (e) {
                calculatedMealAllowance = totalPresent * 25000;
            }
        } else {
            calculatedMealAllowance = totalPresent * 25000;
        }

        const updated = await prisma.attendance.update({
            where: { id: parseInt(id) },
            data: {
                date: new Date(date),
                totalPresent,
                totalAbsent,
                totalMealAllowance: calculatedMealAllowance,
                absentList: typeof absentList === 'string' ? absentList : JSON.stringify(absentList),
                details: details || JSON.stringify({}),
                notes
            }
        });

        // Update Associated CashFlow
        // Find CashFlow with REF:ATT-{id}
        const refString = `[REF:ATT-${id}]`;
        const existingFlow = await prisma.cashFlow.findFirst({
            where: { description: { contains: refString } }
        });

        if (existingFlow) {
            if (calculatedMealAllowance > 0) {
                await prisma.cashFlow.update({
                    where: { id: existingFlow.id },
                    data: {
                        amount: calculatedMealAllowance,
                        date: new Date(date),
                        description: `Uang Makan Harian (${new Date(date).toLocaleDateString('id-ID')}) ${refString}`
                    }
                });
            } else {
                // Keep 0 if no allowance
                await prisma.cashFlow.update({
                    where: { id: existingFlow.id },
                    data: { amount: 0, date: new Date(date) }
                });
            }
        } else if (calculatedMealAllowance > 0) {
            // Create if missing
            await prisma.cashFlow.create({
                data: {
                    type: 'EXPENSE',
                    amount: calculatedMealAllowance,
                    category: 'Konsumsi',
                    description: `Otomatis: Uang Makan (${new Date(updated.date).toLocaleDateString('id-ID')}) [REF:ATT-${id}]`,
                    date: updated.date
                }
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const attendanceId = parseInt(id);

        await prisma.attendance.delete({
            where: { id: attendanceId }
        });

        // ----------------------------------------------------
        // LOGIC: Sync Delete to CashFlow
        // ----------------------------------------------------
        const relatedFlow = await prisma.cashFlow.findFirst({
            where: {
                description: { contains: `[REF:ATT-${attendanceId}]` }
            }
        });

        if (relatedFlow) {
            await prisma.cashFlow.delete({
                where: { id: relatedFlow.id }
            });
        }

        return NextResponse.json({ message: "Attendance deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
    }
}
