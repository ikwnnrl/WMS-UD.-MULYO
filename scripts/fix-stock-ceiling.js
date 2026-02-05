const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function roundUpStock() {
    console.log("Starting stock rounding (Ceiling)...");

    try {
        const products = await prisma.product.findMany();
        console.log(`Checking ${products.length} products...`);

        for (const p of products) {
            // Check if it has decimals
            if (p.quantity % 1 !== 0) {
                const rounded = Math.ceil(p.quantity); // Pembulatan ke atas

                await prisma.product.update({
                    where: { id: p.id },
                    data: { quantity: rounded }
                });

                console.log(`Updated ${p.name}: ${p.quantity} -> ${rounded}`);
            }
        }

        console.log("✅ Stock rounding complete!");

    } catch (e) {
        console.error("Error updating stock:", e);
    } finally {
        await prisma.$disconnect();
    }
}

roundUpStock();
