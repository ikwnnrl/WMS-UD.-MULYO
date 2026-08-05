const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emps = await prisma.employee.findMany();
  let stillDefault = 0;
  const names = [];
  for (const e of emps) {
    const isDefault = await bcrypt.compare('000000', e.pin);
    if (isDefault) {
      stillDefault++;
      names.push(e.name);
    }
  }
  console.log('Total employees:', emps.length);
  console.log('Masih PIN default 000000:', stillDefault);
  console.log('Nama:', names.join(', '));
  await prisma.$disconnect();
}

main();
