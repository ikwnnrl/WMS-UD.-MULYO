import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(suppliers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Fallback: If prisma schema is stale, create basic supplier then update prices via raw sql? 
        // Or just trust create works for basic fields.
        const supplier = await prisma.supplier.create({
            data: {
                name: body.name,
                contact: body.contact,
                bankName: body.bankName,
                accountNumber: body.accountNumber,
                // These might be ignored if schema is stale, effectively 0
                priceTier1: parseFloat(body.priceTier1) || 0,
                priceTier2: parseFloat(body.priceTier2) || 0,
                priceTier3: parseFloat(body.priceTier3) || 0,
            },
        });

        // Return raw query to get full fields if create didn't return them? 
        // For now, standard return.
        return NextResponse.json(supplier);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    }
}
