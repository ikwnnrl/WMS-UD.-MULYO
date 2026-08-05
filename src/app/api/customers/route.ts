import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/customers — list all customers (used by Outbound form & Surat Jalan printing)
export async function GET() {
    try {
        const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

// POST /api/customers — create a new customer (mirrors adding a row to MASTER!A:B)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.name) {
            return NextResponse.json({ error: "Nama customer wajib diisi." }, { status: 400 });
        }
        const customer = await prisma.customer.create({
            data: {
                name: body.name,
                address: body.address || null,
                npwp: body.npwp || null,
            },
        });
        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
