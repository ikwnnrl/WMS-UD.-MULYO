const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Checking latest transactions...");

    const transactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { product: true }
    });

    console.log("Found", transactions.length, "transactions.");
    transactions.forEach(tx => {
        console.log(`[${tx.id}] ${tx.date.toISOString().split('T')[0]} - ${tx.product.name} (${tx.type})`);
        console.log(`    Qty: ${tx.quantity}`);
        console.log(`    Initial: ${tx.initialStock}`);
        console.log(`    Final: ${tx.finalStock}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
