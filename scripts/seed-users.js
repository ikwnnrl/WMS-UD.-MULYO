const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding users...");

    // Create Owner
    const owner = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            pin: '123456',
            role: 'OWNER',
            name: 'Bapak Owner'
        }
    });
    console.log("Created Owner:", owner);

    // Create Staff
    const staff = await prisma.user.upsert({
        where: { username: 'staff' },
        update: {},
        create: {
            username: 'staff',
            pin: '888888',
            role: 'STAFF',
            name: 'Operator Gudang'
        }
    });
    console.log("Created Staff:", staff);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
