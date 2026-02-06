const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Driver User 'Agus'...");

    const driver = await prisma.user.upsert({
        where: { username: 'agus' },
        update: {
            role: 'DRIVER' // Ensure role is updated if exists
        },
        create: {
            username: 'agus',
            pin: '123456', // Default PIN for simplicity, user can change later if feature exists
            name: 'Agus',
            role: 'DRIVER'
        },
    });

    console.log(`User created/updated: ${driver.name} (${driver.role})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
