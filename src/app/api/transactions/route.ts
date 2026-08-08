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

            // Surat Jalan dan Invoice dicetak langsung dari Excel, bukan dari WMS.
            // WMS hanya menyimpan data stok dan logistik.

            // Pelanggan tetap: satu-satunya pelanggan Outbound adalah "PT. Menara Laut
            // Bersatu" (tidak bisa dipilih/diubah dari UI). Cari atau buat record-nya
            // sekali di sini supaya setiap transaksi OUT selalu terhubung dengan benar.
            let customerId = body.customerId ? parseInt(body.customerId) : null;
            if (body.type === "OUT" && !customerId) {
                const FIXED_CUSTOMER_NAME = "PT. Menara Laut Bersatu";
                let fixedCustomer = await tx.customer.findFirst({ where: { name: FIXED_CUSTOMER_NAME } });
                if (!fixedCustomer) {
                    fixedCustomer = await tx.customer.create({
                        data: {
                            name: FIXED_CUSTOMER_NAME,
                            address: "JL. Seram, 1, Mintaragen, Tegal Timur, Kota Tegal, Jawa Tengah 52121",
                        },
                    });
                }
                customerId = fixedCustomer.id;
            }

            // 2. Create Transaction Record with Snapshots
            const transaction = await tx.transaction.create({
                data: {
                    type: body.type,
                    productId: productId,
                    supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                    customerId,
                    quantity: parseFloat(body.quantity),
                    unitCount: body.unitCount ? parseInt(body.unitCount) : null,
                    manifestWeight: parseFloat(body.manifestWeight || 0),
                    actualWeight: parseFloat(body.actualWeight || 0),
                    weightDiff: parseFloat(body.weightDiff || 0),
                    driverName: body.driverName,
                    licensePlate: body.licensePlate,
                    sourceWarehouse: body.sourceWarehouse,
                    destinationWarehouse: body.destinationWarehouse,
                    poNumber: body.poNumber,
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
