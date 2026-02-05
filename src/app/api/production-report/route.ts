import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
        }

        // 1. Fetch Logs within Range
        const logs = await prisma.productionLog.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            orderBy: { date: 'desc' }
        });

        // 2. Fetch Current Solar Stock (Real-time from Product table)
        const solarProduct = await prisma.product.findFirst({
            where: { name: "Solar" }
        });

        const currentSolarStock = solarProduct ? solarProduct.quantity : 0;

        // 3. Aggregate Data
        let totalOutputSacks = 0;
        let totalSolarUsed = 0;

        const tableData = logs.map(log => {
            const outputSacks = log.finishedGoodQty / 50; // Convert Kg back to Sacks
            const ratio = outputSacks > 0 ? log.solarQty / outputSacks : 0;

            totalOutputSacks += outputSacks;
            totalSolarUsed += log.solarQty;

            return {
                id: log.id,
                date: log.date,
                type: log.type,
                outputSacks,
                solarUsed: log.solarQty,
                ratio
            };
        });

        const efficiency = totalOutputSacks > 0 ? (totalSolarUsed / totalOutputSacks) : 0;

        return NextResponse.json({
            summary: {
                totalOutputSacks,
                totalSolarUsed,
                efficiency,
                currentSolarStock,
                minSolarAlert: currentSolarStock < 20
            },
            logs: tableData
        });

    } catch (error) {
        console.error("Production Report Error:", error);
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}
