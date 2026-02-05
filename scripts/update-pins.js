const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating PINs...');

    // 1. Update Admin/Owner PIN
    // Assuming role 'OWNER' or username 'admin'
    const ownerUpdate = await prisma.user.updateMany({
        where: { role: 'OWNER' },
        data: { pin: '111318' }
    });
    console.log(`Updated Owner PINs: ${ownerUpdate.count}`);

    // 2. Update All Employees PIN to '000000'
    const empUpdate = await prisma.employee.updateMany({
        data: { pin: '000000' }
    });
    console.log(`Updated Employee PINs: ${empUpdate.count}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
