const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking employees...");
    const count = await prisma.employee.count();
    console.log(`Total Employees: ${count}`);

    const employees = await prisma.employee.findMany({
        orderBy: { name: 'asc' }
    });

    console.log("List:");
    employees.forEach(e => console.log(`${e.id}: ${e.name} (${e.role || 'N/A'})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
