import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, applicantId } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required to call' }, { status: 400 });
    }

    // Find applicant to log note and possibly update status
    let applicant = null;
    if (applicantId) {
      applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      applicant = await prisma.applicant.findFirst({ where: { phone: { contains: cleanPhone } } });
    }

    // Log the outbound call attempt as a note
    if (applicant) {
      await prisma.note.create({
        data: {
          content: `Outbound call initiated to ${phone} (native dialer)`,
          applicantId: applicant.id,
        },
      });

      // Optionally set status to CONTACTED if currently NEW
      if (applicant.status === 'NEW') {
        await prisma.applicant.update({
          where: { id: applicant.id },
          data: { status: 'CONTACTED' },
        });
      }
    }

    // Always indicate success for the front-end to trigger Google Voice web dialer
    return NextResponse.json({ success: true, connected: false });
  } catch (error: any) {
    console.error('Error initiating native call:', error);
    return NextResponse.json({ error: error.message || 'Failed to process call' }, { status: 500 });
  }
}
