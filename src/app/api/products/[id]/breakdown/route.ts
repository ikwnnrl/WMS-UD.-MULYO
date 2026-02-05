import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        const transactions = await prisma.transaction.findMany({
            where: {
                productId: productId,
                type: 'IN',
            },
            include: {
                supplier: true
            }
        });

        // 1. Supplier Breakdown
        const supplierBreakdown: Record<number, { name: string, total: number, count: number }> = {};

        // 2. Warehouse Breakdown (For Putusan)
        const warehouseBreakdown: Record<string, { name: string, total: number, count: number }> = {};

        transactions.forEach(tx => {
            // Aggregate Supplier
            if (tx.supplierId && tx.supplier) {
                if (!supplierBreakdown[tx.supplierId]) {
                    supplierBreakdown[tx.supplierId] = {
                        name: tx.supplier.name,
                        total: 0,
                        count: 0
                    };
                }
                supplierBreakdown[tx.supplierId].total += tx.quantity;
                supplierBreakdown[tx.supplierId].count += 1;
            }

            // Aggregate Warehouse (Only if sourceWarehouse is present)
            if (tx.sourceWarehouse) {
                // Normalize warehouse name key (uppercase)
                const whKey = tx.sourceWarehouse.toUpperCase().trim();

                if (!warehouseBreakdown[whKey]) {
                    warehouseBreakdown[whKey] = {
                        name: tx.sourceWarehouse, // Keep original casing for display
                        total: 0,
                        count: 0
                    };
                }
                warehouseBreakdown[whKey].total += tx.quantity;
                warehouseBreakdown[whKey].count += 1;
            }
        });

        const result = {
            suppliers: Object.values(supplierBreakdown).sort((a, b) => b.total - a.total),
            warehouses: Object.values(warehouseBreakdown).sort((a, b) => b.total - a.total)
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch breakdown" }, { status: 500 });
    }
}
