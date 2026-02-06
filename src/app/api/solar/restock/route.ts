import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("wms_session");
        const user = sessionCookie ? JSON.parse(sessionCookie.value) : null;

        const body = await request.json();
        const { date, quantity, pricePerLiter, supplierName } = body;

        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerLiter);

        if (!qty || qty <= 0) {
            return NextResponse.json({ error: "Jumlah solar harus valid." }, { status: 400 });
        }

        // Find Solar Product
        const solar = await prisma.product.findFirst({ where: { name: 'Solar' } });
        if (!solar) {
            return NextResponse.json({ error: "Produk 'Solar' tidak ditemukan di sistem." }, { status: 404 });
        }

        // Transaction Logic
        await prisma.$transaction([
            // 1. Update Stock
            prisma.product.update({
                where: { id: solar.id },
                data: { quantity: { increment: qty } }
            }),
            // 2. Create Transaction Log
            prisma.transaction.create({
                data: {
                    type: "IN",
                    productId: solar.id,
                    quantity: qty,
                    pricePerKg: price, // Reusing pricePerKg field for PricePerLiter
                    totalPrice: qty * price,
                    notes: `Restock Solar: ${supplierName || '-'}`,
                    date: new Date(date)
                }
            })
        ]);

        if (user) {
            await createAuditLog('CREATE', 'Transaction', null, `Restock Solar: ${qty} Liter`, user);
        }

        return NextResponse.json({ message: "Stok solar berhasil ditambahkan" });

    } catch (error) {
        console.error("Solar Restock Error:", error);
        return NextResponse.json({ error: "Gagal memproses stok solar" }, { status: 500 });
    }
}
