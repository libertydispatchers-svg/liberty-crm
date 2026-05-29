import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getGmailClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

// Seeded SMS conversations for fallback
const mockSmsThreads = [
  {
    phone: '240-555-0199',
    applicantName: 'Alex Rivera',
    messages: [
      { sender: 'applicant', text: 'Hey, saw the ad for drivers, are you guys still hiring?', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    phone: '410-555-0187',
    applicantName: 'Taylor Smith',
    messages: [
      { sender: 'applicant', text: 'Hi, I sent my application email over, did you get it?', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { sender: 'crm', text: 'Yes Taylor, we received it! Let me review it and I will get back to you shortly.', timestamp: new Date(Date.now() - 3.8 * 60 * 60 * 1000).toISOString() },
      { sender: 'crm', text: 'Hey Taylor, you look like a great fit. Here is the link to complete our digital onboarding (W-9 and Contract): http://localhost:3000/esign/', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    ]
  }
];

export async function GET(request: Request) {
  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    const dbApplicants = await prisma.applicant.findMany();

    if (!hasCreds) {
      // Mock Fallback
      const formatted = mockSmsThreads.map(thread => {
        const app = dbApplicants.find(a => a.phone === thread.phone || a.name === thread.applicantName);
        if (app) {
          return {
            ...thread,
            applicantId: app.id,
            messages: thread.messages.map(m => m.text.includes('/esign/') ? { ...m, text: `Hey Taylor, you look like a great fit. Here is the link to complete our digital onboarding: http://localhost:3000/esign/${app.id}` } : m)
          };
        }
        return thread;
      });

      return NextResponse.json({
        googleVoiceNumber: '(410) 635-4001 (Simulation)',
        connected: false,
        smsThreads: formatted,
        callLogs: [
          { id: 'call-1', applicantName: 'Alex Rivera', phone: '240-555-0199', type: 'missed', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), duration: '0:00', voicemailText: 'Hey this is Alex Rivera, calling about the driver position. I wanted to see what the hours are and what the pay is. Give me a call back at 240-555-0199. Thanks!' }
        ]
      });
    }

    // Connect to Gmail and search for SMS/call logs
    const gmail = getGmailClient();
    
    // Search Gmail for SMS emails
    const searchRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:txt.voice.google.com OR subject:"SMS from"'
    });

    const messages = searchRes.data.messages || [];
    const threadsMap = new Map<string, any>();

    for (const msg of messages) {
      if (!msg.id) continue;
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      const headers = detail.data.payload?.headers || [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';
      const body = detail.data.snippet || '';

      // Parse sender phone number: from address matches 1[phone].[user_phone].[token]@txt.voice.google.com
      const emailRegex = /<([^>]+)>/;
      const match = fromHeader.match(emailRegex);
      const fromEmail = match ? match[1] : fromHeader;

      // Extract phone number from email local part (e.g. 12405550199.14106354001.abc@txt.voice.google.com)
      const phoneParts = fromEmail.split('@')[0].split('.');
      let applicantPhoneRaw = phoneParts[0] || '';
      if (applicantPhoneRaw.startsWith('1') && applicantPhoneRaw.length === 11) {
        applicantPhoneRaw = applicantPhoneRaw.substring(1); // remove country code
      }

      // Format standard format e.g. 240-555-0199
      const phone = applicantPhoneRaw.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || 'Unknown';

      // Find matching applicant in DB
      const app = dbApplicants.find(a => a.phone.replace(/\D/g, '').endsWith(applicantPhoneRaw));
      const applicantName = app ? app.name : `Lead (${phone})`;
      const applicantId = app ? app.id : null;

      // Determine sender
      const isSentByCrm = subjectHeader.toLowerCase().includes('replied') || body.toLowerCase().includes('sent by crm');
      const sender = isSentByCrm ? 'crm' : 'applicant';

      if (!threadsMap.has(phone)) {
        threadsMap.set(phone, {
          phone,
          applicantName,
          applicantId,
          routingEmail: fromEmail, // Save the exact address to reply to
          messages: []
        });
      }

      threadsMap.get(phone).messages.push({
        sender,
        text: body,
        timestamp: new Date(dateHeader).toISOString()
      });
    }

    // Sort messages inside threads by timestamp
    const smsThreads = Array.from(threadsMap.values()).map(t => {
      t.messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return t;
    });

    return NextResponse.json({
      googleVoiceNumber: process.env.DISPATCHER_PHONE_NUMBER || '(410) 635-4001',
      connected: true,
      smsThreads
    });

  } catch (error: any) {
    console.error('Error fetching live Google Voice SMS threads:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch live Voice threads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, applicantId, text } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: 'Phone number and message text are required' }, { status: 400 });
    }

    // Find applicant
    let applicant = null;
    if (applicantId) {
      applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      applicant = await prisma.applicant.findFirst({ 
        where: { phone: { contains: cleanPhone } } 
      });
    }

    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    let emailSent = false;
    let routingAddress = '';

    if (hasCreds) {
      const gmail = getGmailClient();
      
      // Determine routing address. Google Voice email format:
      // [applicant_number].[google_voice_number].[token]@txt.voice.google.com
      // For new threads, we draft standard format: e.g. 12405550199.14106354001@txt.voice.google.com
      const cleanApplicantPhone = phone.replace(/\D/g, '');
      const cleanVoicePhone = (process.env.DISPATCHER_PHONE_NUMBER || '4106354001').replace(/\D/g, '');
      
      // If candidate already has a routing email stored in a recent text thread
      // We can query their email address or construct one
      routingAddress = `1${cleanApplicantPhone}.${cleanVoicePhone}@txt.voice.google.com`;

      // Compose Email Message (raw MIME required by Gmail API)
      const emailLines = [
        `To: ${routingAddress}`,
        `Subject: Re: SMS from ${phone}`,
        `Content-Type: text/plain; charset=utf-8`,
        `MIME-Version: 1.0`,
        ``,
        text
      ];

      const rawEmail = Buffer.from(emailLines.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawEmail }
      });
      emailSent = true;
    }

    // Log the interaction Note in Database
    if (applicant) {
      await prisma.note.create({
        data: {
          content: `Sent SMS to ${phone}: "${text}" ${emailSent ? '(delivered via Google Voice API)' : '(mock simulation logged)'}`,
          applicantId: applicant.id,
        }
      });
      
      // Bump status from NEW to CONTACTED
      if (applicant.status === 'NEW') {
        await prisma.applicant.update({
          where: { id: applicant.id },
          data: { status: 'CONTACTED' }
        });
        await prisma.note.create({
          data: {
            content: `Status updated to CONTACTED (SMS sent)`,
            applicantId: applicant.id,
          }
        });
      }
    }

    const newMessage = {
      sender: 'crm',
      text,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      sentMessage: newMessage,
      loggedToDb: !!applicant,
      emailSent,
      routingAddress
    });

  } catch (error: any) {
    console.error('Error sending SMS via Gmail API:', error);
    return NextResponse.json({ error: error.message || 'Failed to deliver SMS' }, { status: 500 });
  }
}
