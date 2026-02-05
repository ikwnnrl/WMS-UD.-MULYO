const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting backfill of transaction snapshots...");

    const products = await prisma.product.findMany({
        include: {
            transactions: {
                orderBy: { date: 'asc' } // Process in chronological order
            }
        }
    });

    for (const product of products) {
        console.log(`Processing Product: ${product.name} (Current DB Stock: ${product.quantity})`);

        let runningStock = 0; // Assume start from 0 for determining history
        // Use a more nuanced approach: 
        // If we want to trust the current stock and work backwards, we can.
        // But usually, replaying from 0 is safer for audit trails if the log is complete.
        // Let's assume the log is the truth.

        let transactionsToUpdate = [];

        // Sort transactions by date, and then ID to ensure stable order for same-date txs
        // Prisma orderBy is already used, but let's be safe in JS
        const sortedTransactions = product.transactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA === dateB) return a.id - b.id;
            return dateA - dateB;
        });

        for (const tx of sortedTransactions) {
            const initialStock = runningStock;
            const change = tx.type === 'IN' ? tx.quantity : -tx.quantity;
            const finalStock = runningStock + change;

            // Update running stock
            runningStock = finalStock;

            // Prepare update
            // We use updateMany or individual updates. Individual is safer for this logic.
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    initialStock: initialStock,
                    finalStock: finalStock
                }
            });
            console.log(`  Tx #${tx.id} (${tx.type}): ${initialStock} -> ${finalStock} (Change: ${change})`);
        }

        console.log(`  Calculated Final Stock: ${runningStock}`);

        // Correct the product stock if it mismatches the replay (Optional but recommended)
        if (Math.abs(product.quantity - runningStock) > 0.1) {
            console.log(`  MISMATCH! Updating product stock from ${product.quantity} to ${runningStock}`);
            await prisma.product.update({
                where: { id: product.id },
                data: { quantity: runningStock }
            });
        }
    }

    console.log("Backfill completed.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
