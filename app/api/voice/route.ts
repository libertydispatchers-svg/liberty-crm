import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getGmailClient } from '../../../lib/google';
import { MOCK_APPLICANTS } from '../../../lib/mockApplicants';

export const dynamic = 'force-dynamic';

// Seeded SMS conversations for fallback

export async function GET(request: Request) {
  let dbApplicants: any[] = [];
  try {
    dbApplicants = await prisma.applicant.findMany();
  } catch (dbError) {
    console.error('Prisma applicant fetch failed in voice API.', dbError);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    if (!hasCreds) {
      return NextResponse.json({
        googleVoiceNumber: process.env.DISPATCHER_PHONE_NUMBER || '(516) 497-4669',
        connected: false,
        error: 'Google API Credentials missing. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in Vercel.',
        smsThreads: [],
        callLogs: []
      });
    }

    // Connect to Gmail and search for SMS/call logs
    const gmail = getGmailClient();
    
    // Search Gmail for SMS emails and voicemails
    const searchRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:txt.voice.google.com OR from:voice-noreply@google.com',
      maxResults: 300
    });

    const messages = searchRes.data.messages || [];
    const threadsMap = new Map<string, any>();
    const callLogs: any[] = [];

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

      // Extract phone number depending on sender type
      let applicantPhoneRaw = '';
      let phone = 'Unknown';
      let messageType = 'SMS';

      if (fromEmail.endsWith('txt.voice.google.com')) {
        const phoneParts = fromEmail.split('@')[0].split('.');
        applicantPhoneRaw = phoneParts[0] || '';
        if (applicantPhoneRaw.startsWith('1') && applicantPhoneRaw.length === 11) {
          applicantPhoneRaw = applicantPhoneRaw.substring(1); // remove country code
        }
        phone = applicantPhoneRaw.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || 'Unknown';
      } else if (fromEmail === 'voice-noreply@google.com') {
        const phoneMatch = subjectHeader.match(/\d{9,}/) || subjectHeader.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
        if (phoneMatch) {
          phone = phoneMatch[0].replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
          applicantPhoneRaw = phone.replace(/\D/g, '');
        }
        messageType = subjectHeader.toLowerCase().includes('voicemail') ? 'Voicemail' : 'Missed Call';

        // Find matching applicant in DB for log
        const matchedApp = dbApplicants.find(a => a.phone.replace(/\D/g, '').endsWith(applicantPhoneRaw));
        const matchedAppName = matchedApp ? matchedApp.name : `Lead (${phone})`;

        callLogs.push({
          id: msg.id,
          applicantName: matchedAppName,
          applicantId: matchedApp ? matchedApp.id : null,
          type: messageType === 'Voicemail' ? 'voicemail' : 'missed',
          timestamp: new Date(dateHeader).toISOString(),
          duration: body.toLowerCase().includes('duration:') ? body.match(/duration:\s*([^\s•]+)/i)?.[1] || '0m' : (messageType === 'Voicemail' ? '0:45' : '0m'),
          voicemailText: messageType === 'Voicemail' ? body : null
        });
      }

      // Find matching applicant in DB for SMS thread
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
        id: msg.id,
        sender,
        text: messageType === 'SMS' ? body : `[${messageType}] ${subjectHeader}`,
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
      smsThreads,
      callLogs
    });

  } catch (error: any) {
    console.error('Error fetching live Google Voice SMS threads:', error);
    return NextResponse.json({
      googleVoiceNumber: process.env.DISPATCHER_PHONE_NUMBER || 'Unconfigured',
      connected: false,
      error: error.message || 'Failed to fetch live SMS threads',
      smsThreads: [],
      callLogs: []
    }, { status: 500 });
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
    try {
      if (applicantId) {
        applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
      } else {
        const cleanPhone = phone.replace(/\D/g, '');
        applicant = await prisma.applicant.findFirst({ 
          where: { phone: { contains: cleanPhone } } 
        });
      }
    } catch (dbErr) {
      console.warn('Prisma find failed in voice send, running in fallback mode.', dbErr);
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
      try {
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
      } catch (dbErr) {
        console.warn('Failed to log voice message note to database.', dbErr);
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
