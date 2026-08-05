import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // IN or OUT

        const where = type ? { type } : {};

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                product: true,
                supplier: true,
            },
            orderBy: { date: "desc" },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Start transaction to update stock automatically
        const result = await prisma.$transaction(async (tx) => {
            const productId = parseInt(body.productId);
            const stockChange = body.type === 'IN' ? parseFloat(body.quantity) : -parseFloat(body.quantity);

            // 1. Get Current Stock (Initial)
            const product = await tx.product.findUnique({
                where: { id: productId }
            });

            if (!product) throw new Error("Product not found");

            const initialStock = product.quantity;
            const finalStock = initialStock + stockChange;

            // 2. Create Transaction Record with Snapshots
            const transaction = await tx.transaction.create({
                data: {
                    type: body.type,
                    productId: productId,
                    supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                    customerId: body.customerId ? parseInt(body.customerId) : null,
                    quantity: parseFloat(body.quantity),
                    manifestWeight: parseFloat(body.manifestWeight || 0),
                    actualWeight: parseFloat(body.actualWeight || 0),
                    weightDiff: parseFloat(body.weightDiff || 0),
                    driverName: body.driverName,
                    licensePlate: body.licensePlate,
                    sourceWarehouse: body.sourceWarehouse,
                    destinationWarehouse: body.destinationWarehouse,
                    poNumber: body.poNumber,
                    suratJalanNumber: body.suratJalanNumber,
                    notes: body.notes,
                    date: body.date ? new Date(body.date) : new Date(),
                    initialStock: initialStock,
                    finalStock: finalStock,
                    pricePerKg: body.pricePerKg ? parseFloat(body.pricePerKg) : null,
                    totalPrice: body.totalPrice ? parseFloat(body.totalPrice) : null
                },
            });

            // 3. Update Product Stock
            await tx.product.update({
                where: { id: productId },
                data: {
                    quantity: finalStock
                }
            });

            return transaction;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Transaction Error:", error);
        return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
    }
}
