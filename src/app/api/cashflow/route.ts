import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const flows = await prisma.cashFlow.findMany({
            orderBy: { date: "desc" },
        });
        return NextResponse.json(flows);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch cash flow" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const flow = await prisma.cashFlow.create({
            data: {
                type: body.type, // INCOME / EXPENSE
                amount: parseFloat(body.amount),
                category: body.category,
                group: body.group || 'OPERATIONAL', // Default to OPERATIONAL
                description: body.description,
                date: body.date ? new Date(body.date) : new Date(),
            },
        });
        return NextResponse.json(flow);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create cash flow" }, { status: 500 });
    }
}
