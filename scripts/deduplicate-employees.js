const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Finding duplicates...");
    const employees = await prisma.employee.findMany({
        orderBy: { id: 'asc' }
    });

    const seen = new Set();
    const duplicates = [];

    for (const emp of employees) {
        if (seen.has(emp.name)) {
            duplicates.push(emp);
        } else {
            seen.add(emp.name);
        }
    }

    console.log(`Found ${duplicates.length} duplicates.`);

    for (const dup of duplicates) {
        console.log(`Deleting duplicate: ${dup.name} (ID: ${dup.id})`);
        await prisma.employee.delete({
            where: { id: dup.id }
        });
    }

    console.log("Deduplication complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
