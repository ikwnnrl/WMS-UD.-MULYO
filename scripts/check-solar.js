const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for 'Solar' product...");
    const solar = await prisma.product.findFirst({
        where: { name: 'Solar' }
    });

    if (solar) {
        console.log(`Found 'Solar': ID ${solar.id}, Qty: ${solar.quantity}`);
    } else {
        console.log("'Solar' not found. Creating it...");
        const newSolar = await prisma.product.create({
            data: {
                name: 'Solar',
                sku: 'SOLAR-001',
                category: 'Operasional',
                type: 'Lainnya',
                quantity: 100, // Initial stock
                minStock: 50,
                description: 'Bahan bakar mesin produksi'
            }
        });
        console.log(`Created 'Solar': ID ${newSolar.id}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
