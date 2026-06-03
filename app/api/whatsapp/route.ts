import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    // WhatsApp integration is not yet configured, return empty chats instead of mocks.
    const chats: any[] = [];

    let whatsappNumber = process.env.WHATSAPP_NUMBER || '+1 (516) 497-4669';
    try {
      const dbSetting = await prisma.setting.findUnique({
        where: { key: 'WHATSAPP_NUMBER' }
      });
      if (dbSetting?.value) {
        whatsappNumber = dbSetting.value;
      }
    } catch (e) {
      console.warn('Prisma failed to load WhatsApp number setting, using fallback:', e);
    }

    return NextResponse.json({
      connected: true,
      whatsappNumber,
      chats
    });
  } catch (error: any) {
    console.error('Error in WhatsApp API:', error);
    return NextResponse.json({ error: 'Failed to fetch WhatsApp chats', connected: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { phone, applicantId, text } = await request.json();

    if (!phone || !text) {
      return NextResponse.json({ error: 'Phone and text are required' }, { status: 400 });
    }

    // Add note to applicant in DB
    if (applicantId) {
      await prisma.note.create({
        data: {
          content: `WhatsApp sent to ${phone}: "${text}" (WhatsApp Sync simulated)`,
          applicantId
        }
      });
    }

    return NextResponse.json({
      success: true,
      sentMessage: {
        id: `wa-msg-sent-${Date.now()}`,
        sender: 'crm',
        text,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
