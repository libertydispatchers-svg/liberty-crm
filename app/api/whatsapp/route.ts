import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    // Generate mock WhatsApp chats for database applicants to make the sync feel real
    const chats = applicants.map(app => {
      // Mock messages based on status
      const messages = [
        {
          id: `wa-msg-1-${app.id}`,
          sender: 'applicant',
          text: `Hello, I'm interested in the driver position at Liberty Dispatchers.`,
          timestamp: new Date(new Date(app.createdAt).getTime() + 60000).toISOString()
        }
      ];

      if (app.status !== 'NEW') {
        messages.push({
          id: `wa-msg-2-${app.id}`,
          sender: 'crm',
          text: `Hi ${app.name}! Thanks for reaching out. Are you interested in day or overnight shifts? We pay higher rates for overnight drivers.`,
          timestamp: new Date(new Date(app.createdAt).getTime() + 120000).toISOString()
        });
      }

      if (app.status === 'ONBOARDING' || app.status === 'ACTIVE') {
        messages.push({
          id: `wa-msg-3-${app.id}`,
          sender: 'applicant',
          text: `I prefer overnight shifts. I also wanted to ask if you support Chime or CashApp for daily payouts?`,
          timestamp: new Date(new Date(app.createdAt).getTime() + 180000).toISOString()
        });
        messages.push({
          id: `wa-msg-4-${app.id}`,
          sender: 'crm',
          text: `Yes, we support CashApp, Chime, and Zelle for daily payouts! We will send you the onboarding link to capture your info.`,
          timestamp: new Date(new Date(app.createdAt).getTime() + 240000).toISOString()
        });
      }

      return {
        phone: app.phone !== 'N/A' ? app.phone : `+1 (516) 497-4669`,
        applicantName: app.name,
        applicantId: app.id,
        messages
      };
    });

    return NextResponse.json({
      connected: true,
      whatsappNumber: process.env.WHATSAPP_NUMBER || '+1 (516) 497-4669',
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
