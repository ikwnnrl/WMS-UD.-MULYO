import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/invoices — list all invoices with customer info (mirrors Backup Invoice sheet)
export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { date: "desc" },
        });
        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}
