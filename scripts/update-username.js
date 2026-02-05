const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating Owner Username...');

    // Find the user with role 'OWNER'
    const owner = await prisma.user.findFirst({
        where: { role: 'OWNER' }
    });

    if (owner) {
        console.log(`Found owner: ${owner.username}. Updating to 'owner'...`);
        const updated = await prisma.user.update({
            where: { id: owner.id },
            data: { username: 'owner' }
        });
        console.log(`Success! Username updated to: ${updated.username}`);
    } else {
        console.log('No owner found to update.');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
