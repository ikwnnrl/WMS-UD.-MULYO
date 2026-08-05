import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireOwner } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireOwner();
    if (!session) {
        return NextResponse.json({ error: "Hanya OWNER yang dapat mengubah data cash flow." }, { status: 403 });
    }
    try {
        const { id } = await params;
        const flowId = parseInt(id);
        const body = await request.json();

        const updatedFlow = await prisma.cashFlow.update({
            where: { id: flowId },
            data: {
                type: body.type, // INCOME / EXPENSE
                amount: parseFloat(body.amount),
                category: body.category,
                group: body.group,
                description: body.description,
                date: new Date(body.date)
            }
        });

        return NextResponse.json(updatedFlow);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update cash flow" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireOwner();
    if (!session) {
        return NextResponse.json({ error: "Hanya OWNER yang dapat menghapus data cash flow." }, { status: 403 });
    }
    try {
        const { id } = await params;
        const flowId = parseInt(id);

        await prisma.cashFlow.delete({
            where: { id: flowId }
        });

        return NextResponse.json({ message: "Cash flow deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete cash flow" }, { status: 500 });
    }
}
