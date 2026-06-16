const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany({
    where: { name: 'Onboarding Material', status: 'SIGNED' }
  });
  
  let count = 0;
  for (const doc of docs) {
    if (doc.esignData && !doc.esignData.includes('payoutDetails')) {
      console.log(`Fixing doc for applicant ${doc.applicantId}`);
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'PENDING' }
      });
      count++;
    }
  }
  console.log(`Fixed ${count} documents.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
