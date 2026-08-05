const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomPin(length = 6) {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

async function main() {
  const employees = await prisma.employee.findMany();
  const results = [];

  for (const e of employees) {
    const isDefault = await bcrypt.compare('000000', e.pin);
    if (isDefault) {
      const newPin = randomPin();
      const hashed = await bcrypt.hash(newPin, 10);
      await prisma.employee.update({ where: { id: e.id }, data: { pin: hashed } });
      results.push({ name: e.name, pin: newPin });
    }
  }

  console.log('--- PIN BARU (simpan/bagikan ke masing-masing staff) ---');
  for (const r of results) {
    console.log(`${r.name}: ${r.pin}`);
  }
  console.log(`Total diganti: ${results.length}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
