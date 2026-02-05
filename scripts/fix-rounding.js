const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function roundAllData() {
    console.log("Starting database number rounding...");

    try {
        // 1. Round Products
        const products = await prisma.product.findMany();
        console.log(`Checking ${products.length} products...`);
        for (const p of products) {
            if (p.quantity % 1 !== 0) {
                const rounded = Math.round(p.quantity);
                await prisma.product.update({
                    where: { id: p.id },
                    data: { quantity: rounded }
                });
                console.log(`Rounded Product ${p.name}: ${p.quantity} -> ${rounded}`);
            }
        }

        // 2. Round Production Logs
        const logs = await prisma.productionLog.findMany();
        console.log(`Checking ${logs.length} production logs...`);
        for (const log of logs) {
            let updated = false;
            const newData = {};

            if (log.rawMaterialQty % 1 !== 0) {
                newData.rawMaterialQty = Math.round(log.rawMaterialQty);
                updated = true;
            }
            if (log.finishedGoodQty % 1 !== 0) {
                newData.finishedGoodQty = Math.round(log.finishedGoodQty);
                updated = true;
            }
            if (log.solarQty % 1 !== 0) {
                newData.solarQty = Math.round(log.solarQty);
                updated = true;
            }

            if (updated) {
                await prisma.productionLog.update({
                    where: { id: log.id },
                    data: newData
                });
                console.log(`Rounded Log #${log.id}`);
            }
        }

        // 3. Round Transactions
        const transactions = await prisma.transaction.findMany();
        console.log(`Checking ${transactions.length} transactions...`);
        for (const t of transactions) {
            if (t.quantity % 1 !== 0) {
                const rounded = Math.round(t.quantity);
                await prisma.transaction.update({
                    where: { id: t.id },
                    data: { quantity: rounded }
                });
                // No log for huge transaction lists to keep console clean, unless needed
            }
        }

        console.log("✅ Database rounding complete!");

    } catch (e) {
        console.error("Error rounding database:", e);
    } finally {
        await prisma.$disconnect();
    }
}

roundAllData();
