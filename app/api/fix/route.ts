import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const docs = await prisma.document.findMany({
      where: { name: 'Onboarding Material', status: 'SIGNED' }
    });
    
    let count = 0;
    for (const doc of docs) {
      if (doc.esignData && !doc.esignData.includes('payoutDetails')) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: 'PENDING' }
        });
        count++;
      }
    }
    return NextResponse.json({ message: `Fixed ${count} documents` });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
