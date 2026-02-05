const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDoubleMultiplication() {
    console.log("Starting detection of double-multiplied raw material logs...");

    try {
        const logs = await prisma.productionLog.findMany();
        let fixedCount = 0;

        for (const log of logs) {
            // Expected Raw Material = FinishedGoodQty / 0.9
            const expectedRawMat = log.finishedGoodQty / 0.9;

            // Current Raw Material
            const currentRawMat = log.rawMaterialQty;

            // Check if current is roughly 50x of expected (allow small margin for rounding diffs)
            // 50x because the bug was * 50
            const ratio = currentRawMat / expectedRawMat;

            if (ratio > 40 && ratio < 60) { // It should be exactly 50, but let's be safe
                console.log(`Log #${log.id} looks WRONG. Ratio: ${ratio.toFixed(1)}x`);
                console.log(`  Finished: ${log.finishedGoodQty}, Current Raw: ${currentRawMat}, Expected: ${Math.round(expectedRawMat)}`);

                const correctRawMat = Math.round(expectedRawMat);
                const diff = currentRawMat - correctRawMat; // This amount should be ADDED back to stock

                // 1. Update Log
                await prisma.productionLog.update({
                    where: { id: log.id },
                    data: { rawMaterialQty: correctRawMat }
                });

                // 2. Update Product Stock (Return the over-deducted amount)
                const product = await prisma.product.findFirst({ where: { name: log.rawMaterialName } });
                if (product) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: { quantity: { increment: diff } }
                    });
                    console.log(`  > Restored ${diff} Kg to ${product.name}`);
                }

                // 3. Optional: Add a correction transaction? 
                // For simplicity, we just fix the stock silently or maybe log it?
                // Let's log a transaction so it's traceable
                if (product) {
                    await prisma.transaction.create({
                        data: {
                            type: "IN",
                            productId: product.id,
                            quantity: diff,
                            notes: `System Fix: Koreksi kesalahan berhitung (Bug 50x) pada Log #${log.id}`
                        }
                    });
                }

                fixedCount++;
            }
        }

        console.log(`✅ Completed. Fixed ${fixedCount} logs.`);

    } catch (e) {
        console.error("Error fixing logs:", e);
    } finally {
        await prisma.$disconnect();
    }
}

fixDoubleMultiplication();
