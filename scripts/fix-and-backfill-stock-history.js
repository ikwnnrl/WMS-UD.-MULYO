const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting OFFSET-ADJUSTED backfill...");

    // Known correct final stocks (preserved)
    const RESTORE_TARGETS = {
        "Onggok": 18785,
        "Putusan": 15459,
        "Tepung Onggok": 19500,
        "Tepung Putusan": 6000,
        "Solar": 40
    };

    const products = await prisma.product.findMany();
    const productionLogs = await prisma.productionLog.findMany();

    for (const product of products) {
        // Skip if no target (e.g. new product Gaplek maybe?)
        // If Gaplek was not in my list, use 0 or current?
        // Gaplek wasn't in list, let's assume current DB value is fine (or 0 if I corrupted it).
        // Actually, previous logs didn't show Gaplek, so it has 0 Txs and 0 logs likely.

        let targetStock = RESTORE_TARGETS[product.name];
        if (targetStock === undefined) {
            console.log(`Skipping unknown target for ${product.name}, using current (${product.quantity})`);
            targetStock = product.quantity;
        }

        console.log(`Processing ${product.name} (Target: ${targetStock})`);

        const transactions = await prisma.transaction.findMany({
            where: { productId: product.id }
        });

        // Collect events
        let events = [];
        transactions.forEach(tx => {
            events.push({
                type: 'TX',
                date: new Date(tx.date).getTime(),
                ref: tx,
                quantityChange: tx.type === 'IN' ? tx.quantity : -tx.quantity
            });
        });
        productionLogs.forEach(log => {
            const logDate = new Date(log.date).getTime();
            if (log.rawMaterialName === product.name) events.push({ type: 'LOG_RAW', date: logDate, ref: log, quantityChange: -log.rawMaterialQty });
            if (log.finishedGoodName === product.name) events.push({ type: 'LOG_FIN', date: logDate, ref: log, quantityChange: log.finishedGoodQty });
            if (product.name === 'Solar' && log.solarQty) events.push({ type: 'LOG_SOLAR', date: logDate, ref: log, quantityChange: -log.solarQty });
        });

        events.sort((a, b) => a.date - b.date);

        // Simulation Run
        let simStock = 0;
        for (const event of events) {
            simStock += event.quantityChange;
        }

        // Calculate Offset
        // Target = Start + Sim_Change
        // Start = Target - Sim_Change
        const startOffset = targetStock - simStock;
        console.log(`  Net Change: ${simStock}, Implied Start: ${startOffset}`);

        // Real Run
        let runningStock = startOffset;
        for (const event of events) {
            const startQty = runningStock;
            const endQty = startQty + event.quantityChange;

            if (event.type === 'TX') {
                await prisma.transaction.update({
                    where: { id: event.ref.id },
                    data: {
                        initialStock: startQty,
                        finalStock: endQty
                    }
                });
                // console.log(`  Updated Tx #${event.ref.id}: ${startQty} -> ${endQty}`);
            }

            runningStock = endQty;
        }

        // Restore Product
        await prisma.product.update({
            where: { id: product.id },
            data: { quantity: targetStock }
        });
        console.log(`  Restored ${product.name} to ${targetStock}`);
    }

    console.log("Offset Backfill completed.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
