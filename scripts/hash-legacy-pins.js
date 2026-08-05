const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (!isBcryptHash(u.pin)) {
      const hashed = await bcrypt.hash(u.pin, 10);
      await prisma.user.update({ where: { id: u.id }, data: { pin: hashed } });
      console.log('Hashed PIN for user:', u.username);
    } else {
      console.log('Already hashed:', u.username);
    }
  }

  const employees = await prisma.employee.findMany();
  for (const e of employees) {
    if (!isBcryptHash(e.pin)) {
      const hashed = await bcrypt.hash(e.pin, 10);
      await prisma.employee.update({ where: { id: e.id }, data: { pin: hashed } });
      console.log('Hashed PIN for employee:', e.name);
    } else {
      console.log('Already hashed:', e.name);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
