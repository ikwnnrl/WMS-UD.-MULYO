import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supplierId = parseInt(id);
        const body = await request.json();

        const p1 = parseFloat(body.priceTier1) || 0;
        const p2 = parseFloat(body.priceTier2) || 0;
        const p3 = parseFloat(body.priceTier3) || 0;

        await prisma.$executeRaw`
            UPDATE Supplier 
            SET name = ${body.name}, 
                contact = ${body.contact}, 
                bankName = ${body.bankName}, 
                accountNumber = ${body.accountNumber}, 
                priceTier1 = ${p1}, 
                priceTier2 = ${p2}, 
                priceTier3 = ${p3},
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ${supplierId}
        `;

        // Return the data we just saved
        return NextResponse.json({ ...body, id: supplierId, priceTier1: p1, priceTier2: p2, priceTier3: p3 });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
    }
}


export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supplierId = parseInt(id);

        await prisma.supplier.delete({
            where: { id: supplierId }
        });

        return NextResponse.json({ message: "Supplier deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
    }
}
