const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Altering table Applicant...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Applicant" ADD COLUMN "passwordHash" TEXT;`);
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
