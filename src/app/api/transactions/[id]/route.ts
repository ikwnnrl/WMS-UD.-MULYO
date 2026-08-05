import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireOwner } from "@/lib/auth";

const prisma = new PrismaClient();

// Handle PUT (Update Transaction)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireOwner();
    if (!session) {
        return NextResponse.json({ error: "Hanya OWNER yang dapat mengubah transaksi." }, { status: 403 });
    }
    try {
        const { id } = await params;
        const transactionId = parseInt(id);
        const body = await request.json(); // New data

        // 1. Get Old Transaction to revert stock
        const oldTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { product: true }
        });

        if (!oldTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // 2. Revert Old Stock Effect
        // If it was IN -> Decrease Stock
        // If it was OUT -> Increase Stock
        // We do this first to return to "pre-transaction" state
        let currentStock = oldTransaction.product.quantity;
        if (oldTransaction.type === 'IN') {
            currentStock -= oldTransaction.quantity;
        } else {
            currentStock += oldTransaction.quantity;
        }

        // 3. Apply New Stock Effect
        // Using new quantity from body
        const newQuantity = parseFloat(body.quantity);
        if (body.type === 'IN') {
            currentStock += newQuantity;
        } else {
            currentStock -= newQuantity;
        }

        // 4. Update Transaction and Product in transaction (all or nothing)
        const updatedTransaction = await prisma.$transaction(async (tx) => {
            // Update Product Stock
            await tx.product.update({
                where: { id: oldTransaction.productId },
                data: { quantity: currentStock }
            });

            // Update Transaction Record
            return await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    type: body.type,
                    quantity: newQuantity,
                    notes: body.notes,
                    date: new Date(body.date),
                    driverName: body.driverName,
                    licensePlate: body.licensePlate,
                    // If Putusan/Onggok fields exist in body, update them too
                    sourceWarehouse: body.sourceWarehouse,
                    manifestWeight: body.manifestWeight ? parseFloat(body.manifestWeight) : null,
                    actualWeight: body.actualWeight ? parseFloat(body.actualWeight) : null,
                    weightDiff: body.weightDiff ? parseFloat(body.weightDiff) : null,
                }
            });
        });

        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }
}

// Handle DELETE (Remove Transaction)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireOwner();
    if (!session) {
        return NextResponse.json({ error: "Hanya OWNER yang dapat menghapus transaksi." }, { status: 403 });
    }
    try {
        const { id } = await params;
        const transactionId = parseInt(id);

        // 1. Get Transaction Details
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { product: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // 2. Revert Stock Effect
        let newStock = transaction.product.quantity;
        if (transaction.type === 'IN') {
            // Was IN, so we Remove it -> Decrease Stock
            newStock -= transaction.quantity;
        } else {
            // Was OUT, so we Remove it -> Increase Stock (Return items)
            newStock += transaction.quantity;
        }

        // 3. Delete Transaction and Update Stock
        await prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: transaction.productId },
                data: { quantity: newStock }
            });

            await tx.transaction.delete({
                where: { id: transactionId }
            });
        });

        return NextResponse.json({ message: "Transaction deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }
}
