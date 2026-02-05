import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const logs = await prisma.productionLog.findMany({
            orderBy: { date: 'desc' },
            take: 50
        });
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wms_session");
        const user = sessionCookie ? JSON.parse(sessionCookie.value) : null;

        const body = await request.json();
        const { date, type, finishedGoodQty, solarQty, notes, rawMaterialPrice, solarPrice, otherCost } = body;

        // Determine Product Names based on Type
        let rawMaterialName = "";
        let finishedGoodName = "";

        if (type === "Giling Onggok") {
            rawMaterialName = "Onggok";
            finishedGoodName = "Tepung Onggok";
        } else if (type === "Giling Putusan") {
            rawMaterialName = "Putusan";
            finishedGoodName = "Tepung Putusan";
        } else {
            return NextResponse.json({ error: "Invalid production type" }, { status: 400 });
        }

        const solarName = "Solar";

        // Find Products
        const rawMaterial = await prisma.product.findFirst({ where: { name: rawMaterialName } });
        const finishedGood = await prisma.product.findFirst({ where: { name: finishedGoodName } });
        const solar = await prisma.product.findFirst({ where: { name: solarName } });

        if (!rawMaterial) return NextResponse.json({ error: `Product ${rawMaterialName} not found.` }, { status: 404 });
        if (!finishedGood) return NextResponse.json({ error: `Product ${finishedGoodName} not found.` }, { status: 404 });
        if (!solar) return NextResponse.json({ error: "Product 'Solar' not found." }, { status: 404 });

        // Calculate Usage
        const productionOutputKg = finishedGoodQty;
        const rawMaterialKg = Math.round(productionOutputKg / 0.9);

        // HPP Calculation
        const priceRaw = Number(rawMaterialPrice) || 0;
        const priceSolar = Number(solarPrice) || 6800; // Default solar price
        const costRaw = rawMaterialKg * priceRaw;
        const costSolar = solarQty * priceSolar;
        const costOther = Number(otherCost) || 0;

        const totalCost = costRaw + costSolar + costOther;
        const hppPerKg = finishedGoodQty > 0 ? Math.round(totalCost / finishedGoodQty) : 0;

        await prisma.$transaction([
            // 1. Raw Material
            prisma.product.update({
                where: { id: rawMaterial.id },
                data: { quantity: { decrement: rawMaterialKg } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT",
                    productId: rawMaterial.id,
                    quantity: rawMaterialKg,
                    notes: `Produksi: ${type} (Input for ${finishedGoodQty} Sak)`
                }
            }),

            // 2. Finished Good
            prisma.product.update({
                where: { id: finishedGood.id },
                data: { quantity: { increment: finishedGoodQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN",
                    productId: finishedGood.id,
                    quantity: finishedGoodQty,
                    notes: `Produksi: ${type} (Output)`
                }
            }),

            // 3. Solar
            prisma.product.update({
                where: { id: solar.id },
                data: { quantity: { decrement: solarQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT",
                    productId: solar.id,
                    quantity: solarQty,
                    notes: `Produksi: ${type} (Solar Usage)`
                }
            }),

            // 4. Production Log
            prisma.productionLog.create({
                data: {
                    date: new Date(date),
                    type,
                    rawMaterialName,
                    rawMaterialQty: rawMaterialKg,
                    finishedGoodName,
                    finishedGoodQty,
                    solarQty,
                    notes,
                    rawMaterialPrice: priceRaw,
                    solarPrice: priceSolar,
                    otherCost: costOther,
                    totalCost,
                    hppPerKg
                }
            })
        ]);

        if (user) {
            await createAuditLog('CREATE', 'Production', null, `Input Production ${type}: ${finishedGoodQty} Sak`, user);
        }

        return NextResponse.json({ message: "Production logged successfully" });

    } catch (error) {
        console.error("Production Log Error:", error);
        return NextResponse.json({ error: "Failed to process production log" }, { status: 500 });
    }
}
