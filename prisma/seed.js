const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing CRM data...');
  await prisma.document.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.applicant.deleteMany({});

  console.log('Seeding driver applicants...');

  const alex = await prisma.applicant.create({
    data: {
      name: 'Alex Rivera',
      phone: '240-555-0199',
      email: 'alex.rivera92@gmail.com',
      status: 'NEW',
      source: 'TEXT',
      availability: JSON.stringify({
        monday: ['morning', 'afternoon'],
        tuesday: ['morning', 'afternoon'],
        wednesday: ['morning', 'afternoon'],
        thursday: ['morning', 'afternoon'],
        friday: ['morning', 'afternoon', 'evening'],
        saturday: ['evening'],
        sunday: []
      }),
      notes: {
        create: [
          { content: 'Text inquiry: "Hey saw the ad for drivers, are you guys still hiring?"' }
        ]
      },
      documents: {
        create: [
          { name: 'Onboarding Material', status: 'NOT_SENT' },
          { name: 'W-9 Form', status: 'NOT_SENT' },
          { name: 'Driver Contract', status: 'NOT_SENT' }
        ]
      }
    }
  });

  const jordan = await prisma.applicant.create({
    data: {
      name: 'Jordan Vance',
      phone: '301-555-0142',
      email: 'jordan.vance@yahoo.com',
      status: 'CONTACTED',
      source: 'CALL',
      availability: JSON.stringify({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: ['evening'],
        saturday: ['morning', 'afternoon', 'evening'],
        sunday: ['morning', 'afternoon', 'evening']
      }),
      notes: {
        create: [
          { content: 'Called the Workspace line. Interested in weekend shifts only. Left voicemail.' },
          { content: 'Called back: Spoke to Jordan. He is a college student looking for part-time. Sounds very polite and reliable. Marked as Contacted, preparing to send contract.' }
        ]
      },
      documents: {
        create: [
          { name: 'Onboarding Material', status: 'NOT_SENT' },
          { name: 'W-9 Form', status: 'NOT_SENT' },
          { name: 'Driver Contract', status: 'NOT_SENT' }
        ]
      }
    }
  });

  const taylor = await prisma.applicant.create({
    data: {
      name: 'Taylor Smith',
      phone: '410-555-0187',
      email: 'taylorsmith.delivery@gmail.com',
      status: 'ONBOARDING',
      source: 'EMAIL',
      availability: JSON.stringify({
        monday: ['afternoon', 'evening'],
        tuesday: ['afternoon', 'evening'],
        wednesday: ['afternoon', 'evening'],
        thursday: ['afternoon', 'evening'],
        friday: ['afternoon', 'evening'],
        saturday: [],
        sunday: []
      }),
      notes: {
        create: [
          { content: 'Emailed resume. Has 2 years experience with DoorDash and UberEats.' },
          { content: 'Screened Taylor via call. Confirmed they have a clean driving record and reliable vehicle.' },
          { content: 'Sent e-sign onboarding link for Driver Contract and W-9.' }
        ]
      },
      documents: {
        create: [
          { name: 'Onboarding Material', status: 'SENT', sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          { name: 'W-9 Form', status: 'SENT', sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          { name: 'Driver Contract', status: 'SENT', sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  const casey = await prisma.applicant.create({
    data: {
      name: 'Casey Johnson',
      phone: '443-555-0111',
      email: 'casey.johnson.dispatch@gmail.com',
      status: 'ACTIVE',
      source: 'EMAIL',
      availability: JSON.stringify({
        monday: ['morning', 'afternoon', 'evening'],
        tuesday: ['morning', 'afternoon', 'evening'],
        wednesday: ['morning', 'afternoon', 'evening'],
        thursday: ['morning', 'afternoon', 'evening'],
        friday: ['morning', 'afternoon', 'evening'],
        saturday: [],
        sunday: []
      }),
      notes: {
        create: [
          { content: 'Applied via Libertydispatch.com email query.' },
          { content: 'Sent onboarding documents.' },
          { content: 'Completed W-9, signed contract, and confirmed full availability.' },
          { content: 'Completed background check. Onboarded and active. Ready for shifts!' }
        ]
      },
      documents: {
        create: [
          { name: 'Onboarding Material', status: 'SIGNED', sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), fileUrl: '#' },
          { name: 'W-9 Form', status: 'SIGNED', sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), fileUrl: '#', esignData: JSON.stringify({ ssn: '***-**-1234', address: '123 Main St, Baltimore MD 21201', classification: 'Individual' }) },
          { name: 'Driver Contract', status: 'SIGNED', sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), fileUrl: '#', esignData: JSON.stringify({ signature: 'Casey Johnson', ipAddress: '192.168.1.50' }) }
        ]
      }
    }
  });

  const morgan = await prisma.applicant.create({
    data: {
      name: 'Morgan Lee',
      phone: '202-555-0134',
      email: 'morganlee.drive@gmail.com',
      status: 'REJECTED',
      source: 'TEXT',
      availability: JSON.stringify({
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      }),
      notes: {
        create: [
          { content: 'Text inquiry: "Need a job. Don\'t have a car though, can I walk or bike?"' },
          { content: 'Replied that a reliable personal vehicle is required for our delivery platform. Morgan confirmed they do not have a license or car. Marked as Rejected.' }
        ]
      },
      documents: {
        create: [
          { name: 'Onboarding Material', status: 'NOT_SENT' },
          { name: 'W-9 Form', status: 'NOT_SENT' },
          { name: 'Driver Contract', status: 'NOT_SENT' }
        ]
      }
    }
  });

  console.log(`Seeding complete. Created 5 drivers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
