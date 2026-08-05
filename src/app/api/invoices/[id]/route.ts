import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

// PUT /api/invoices/[id] — toggle paid status (mirrors the green checkbox in Backup Invoice)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireOwner();
    if (!session) {
        return NextResponse.json({ error: "Hanya OWNER yang dapat mengubah status invoice." }, { status: 403 });
    }
    try {
        const { id } = await params;
        const invoiceId = parseInt(id);
        const body = await request.json();

        const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                isPaid: !!body.isPaid,
                paidAt: body.isPaid ? new Date() : null,
            },
        });

        return NextResponse.json(invoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}
