import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const productId = parseInt(id);
        const body = await request.json();

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                minStock: body.minStock,
                description: body.description,
                // Name, SKU, and Type are typically not editable to preserve historical data integrity, 
                // but if requested we can enable it. For now, sticking to safe edits.
            }
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const productId = parseInt(id);

        // Optional: Check if product has transactions before deleting? 
        // For simplicity, we'll allow deletion but Prisma might throw error if foreign keys exist without cascade.
        // Let's assume for now user knows what they are doing or we handle it.

        await prisma.product.delete({
            where: { id: productId }
        });

        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete product. It might be used in transactions." }, { status: 500 });
    }
}
