import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE: Hapus Log Produksi & Kembalikan Stok
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // 1. Ambil data log lama
        const oldLog = await prisma.productionLog.findUnique({
            where: { id }
        });

        if (!oldLog) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        // 2. Ambil produk terkait
        const rawMaterial = await prisma.product.findFirst({ where: { name: oldLog.rawMaterialName } });
        const finishedGood = await prisma.product.findFirst({ where: { name: oldLog.finishedGoodName } });
        const solar = await prisma.product.findFirst({ where: { name: "Solar" } }); // Solar fixed name

        if (!rawMaterial || !finishedGood || !solar) {
            return NextResponse.json({ error: "Related products not found in inventory" }, { status: 404 });
        }

        // 3. Transaksi Database (Revert Stock)
        await prisma.$transaction([
            // Revert Raw Material (Increment back)
            prisma.product.update({
                where: { id: rawMaterial.id },
                data: { quantity: { increment: oldLog.rawMaterialQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN", // Correction: Back to stock
                    productId: rawMaterial.id,
                    quantity: oldLog.rawMaterialQty,
                    notes: `Koreksi: Hapus Log Produksi #${id} (Kembali ke Stok)`
                }
            }),

            // Revert Finished Good (Decrement)
            prisma.product.update({
                where: { id: finishedGood.id },
                data: { quantity: { decrement: oldLog.finishedGoodQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT", // Correction: Remove from stock
                    productId: finishedGood.id,
                    quantity: oldLog.finishedGoodQty,
                    notes: `Koreksi: Hapus Log Produksi #${id} (Batal Produksi)`
                }
            }),

            // Revert Solar (Increment back)
            prisma.product.update({
                where: { id: solar.id },
                data: { quantity: { increment: oldLog.solarQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN", // Correction: Back to stock
                    productId: solar.id,
                    quantity: oldLog.solarQty,
                    notes: `Koreksi: Hapus Log Produksi #${id} (Kembali ke Stok)`
                }
            }),

            // Hapus Log
            prisma.productionLog.delete({
                where: { id }
            })
        ]);

        return NextResponse.json({ message: "Log deleted and stock reverted successfully" });

    } catch (error: any) {
        console.error("Delete Log Error details:", error);
        return NextResponse.json({ error: `Failed to delete log: ${error.message || error}` }, { status: 500 });
    }
}

// PUT: Update Log Produksi (Revert Old + Apply New)
export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await request.json();
        const { date, type, finishedGoodQty, solarQty, notes } = body; // New Data

        // 1. Ambil data log lama
        const oldLog = await prisma.productionLog.findUnique({
            where: { id }
        });

        if (!oldLog) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        // 2. Ambil produk terkait (Old & New Names might change if Type changes)
        // Determine New Product Names based on New Type
        let newRawMaterialName = "";
        let newFinishedGoodName = "";

        if (type === "Giling Onggok") {
            newRawMaterialName = "Onggok";
            newFinishedGoodName = "Tepung Onggok";
        } else if (type === "Giling Putusan") {
            newRawMaterialName = "Putusan";
            newFinishedGoodName = "Tepung Putusan";
        } else {
            return NextResponse.json({ error: "Invalid production type" }, { status: 400 });
        }

        // Products
        const oldRawMaterial = await prisma.product.findFirst({ where: { name: oldLog.rawMaterialName } });
        const oldFinishedGood = await prisma.product.findFirst({ where: { name: oldLog.finishedGoodName } });

        const newRawMaterial = await prisma.product.findFirst({ where: { name: newRawMaterialName } });
        const newFinishedGood = await prisma.product.findFirst({ where: { name: newFinishedGoodName } });

        const solar = await prisma.product.findFirst({ where: { name: "Solar" } });

        if (!oldRawMaterial || !oldFinishedGood || !newRawMaterial || !newFinishedGood || !solar) {
            return NextResponse.json({ error: "Related products not found" }, { status: 404 });
        }

        // Calculate New Raw Material Usage (Shrinkage 10%)
        // finishedGoodQty from body is already in Kg (sent by frontend)
        const newOutputKg = finishedGoodQty;
        const newRawMaterialKg = Math.round(newOutputKg / 0.9);

        // Transaction: Revert Old -> Apply New -> Update Log
        await prisma.$transaction([
            // --- REVERT OLD ---
            // Revert Old Raw Material (Increment)
            prisma.product.update({
                where: { id: oldRawMaterial.id },
                data: { quantity: { increment: oldLog.rawMaterialQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN",
                    productId: oldRawMaterial.id,
                    quantity: oldLog.rawMaterialQty,
                    notes: `Koreksi Edit Log #${id}: Revert Input`
                }
            }),
            // Revert Old Finished Good (Decrement)
            prisma.product.update({
                where: { id: oldFinishedGood.id },
                data: { quantity: { decrement: oldLog.finishedGoodQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT",
                    productId: oldFinishedGood.id,
                    quantity: oldLog.finishedGoodQty,
                    notes: `Koreksi Edit Log #${id}: Revert Output`
                }
            }),
            // Revert Old Solar (Increment)
            prisma.product.update({
                where: { id: solar.id },
                data: { quantity: { increment: oldLog.solarQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN",
                    productId: solar.id,
                    quantity: oldLog.solarQty,
                    notes: `Koreksi Edit Log #${id}: Revert Solar`
                }
            }),

            // --- APPLY NEW ---
            // Decrease New Raw Material
            prisma.product.update({
                where: { id: newRawMaterial.id },
                data: { quantity: { decrement: newRawMaterialKg } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT",
                    productId: newRawMaterial.id,
                    quantity: newRawMaterialKg,
                    notes: `Edit Log #${id}: Baru (Input)`
                }
            }),
            // Increase New Finished Good
            prisma.product.update({
                where: { id: newFinishedGood.id },
                data: { quantity: { increment: finishedGoodQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN",
                    productId: newFinishedGood.id,
                    quantity: finishedGoodQty,
                    notes: `Edit Log #${id}: Baru (Output)`
                }
            }),
            // Decrease Solar (New Qty)
            prisma.product.update({
                where: { id: solar.id },
                data: { quantity: { decrement: solarQty } }
            }),
            prisma.transaction.create({
                data: {
                    type: "OUT",
                    productId: solar.id,
                    quantity: solarQty,
                    notes: `Edit Log #${id}: Baru (Solar)`
                }
            }),

            // --- UPDATE LOG ---
            prisma.productionLog.update({
                where: { id },
                data: {
                    date: new Date(date),
                    type,
                    rawMaterialName: newRawMaterialName,
                    rawMaterialQty: newRawMaterialKg,
                    finishedGoodName: newFinishedGoodName,
                    finishedGoodQty,
                    solarQty,
                    notes
                }
            })
        ]);

        return NextResponse.json({ message: "Log updated successfully" });

    } catch (error: any) {
        console.error("Update Log Error details:", error);
        return NextResponse.json({ error: `Failed to update log: ${error.message || error}` }, { status: 500 });
    }
}
