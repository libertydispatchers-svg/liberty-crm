import { NextResponse } from 'next/server';
import { getGmailClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

// Fallback Mock Data if environment variables are not configured yet
const mockEmails = [
  {
    id: 'msg-1',
    from: 'voice-noreply@google.com',
    fromName: 'Google Voice Voicemail',
    to: 'recruit@libertydispatchers.com',
    subject: 'New voicemail from (240) 555-0199',
    body: 'New voicemail from Alex Rivera (240) 555-0199:\n\n"Hey this is Alex Rivera, calling about the driver position. I wanted to see what the hours are and what the pay is. Give me a call back at 240-555-0199. Thanks!"',
    date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isGoogleVoice: true,
    type: 'voicemail',
    senderNumber: '240-555-0199'
  },
  {
    id: 'msg-2',
    from: '14106354001.12405550199.abc@txt.voice.google.com',
    fromName: 'Alex Rivera (via SMS)',
    to: 'recruit@libertydispatchers.com',
    subject: 'SMS from (240) 555-0199',
    body: 'Hey, saw the ad for drivers, are you guys still hiring?',
    date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isGoogleVoice: true,
    type: 'sms',
    senderNumber: '240-555-0199'
  },
  {
    id: 'msg-3',
    from: 'taylorsmith.delivery@gmail.com',
    fromName: 'Taylor Smith',
    to: 'recruit@libertydispatchers.com',
    subject: 'Driver Application: Taylor Smith (Clean Record & Experience)',
    body: 'Hi, I saw your ad on Craigslist for delivery drivers for the flower and smoke delivery platform. I have attached my resume. I have 2 years of delivery experience with UberEats and a clean driving record in Maryland. I am available mostly weekday afternoons and evenings. I look forward to hearing from you!\n\nBest,\nTaylor Smith\nPhone: 410-555-0187',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isGoogleVoice: false,
    type: 'email'
  },
  {
    id: 'msg-4',
    from: 'voice-noreply@google.com',
    fromName: 'Google Voice Call Alert',
    to: 'recruit@libertydispatchers.com',
    subject: 'Missed call from (301) 555-0142 at 10:15 AM',
    body: 'Google Voice missed call notification:\n\nCaller: (301) 555-0142 (Jordan Vance)\nTime: May 28, 2026 at 10:15 AM EDT\nNo voicemail was left.',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isGoogleVoice: true,
    type: 'missed_call',
    senderNumber: '301-555-0142'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Check if Google credentials are set
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    if (!hasCreds) {
      // Return simulated mock data if credentials are not configured
      let emails = [...mockEmails];
      if (filter === 'email') {
        emails = emails.filter(e => !e.isGoogleVoice);
      } else if (filter === 'voice') {
        emails = emails.filter(e => e.isGoogleVoice);
      }
      return NextResponse.json({
        connected: false,
        emailAddress: 'recruit@libertydispatchers.com (Simulation Mode)',
        emails
      });
    }

    // Connect to live Gmail API
    const gmail = getGmailClient();
    
    // Fetch last 15 emails from Inbox
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'label:INBOX',
      maxResults: 15
    });

    const messages = listRes.data.messages || [];
    const emails: any[] = [];

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
      const toHeader = headers.find(h => h.name?.toLowerCase() === 'to')?.value || '';
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      // Parse sender name and email address
      let fromName = fromHeader;
      let fromEmail = fromHeader;
      const emailRegex = /<([^>]+)>/;
      const match = fromHeader.match(emailRegex);
      if (match) {
        fromEmail = match[1];
        fromName = fromHeader.split('<')[0].trim().replace(/"/g, '');
      }

      // Read snippet/body
      const snippet = detail.data.snippet || '';
      
      // Determine Google Voice type
      const isGoogleVoice = fromEmail.endsWith('txt.voice.google.com') || fromEmail === 'voice-noreply@google.com';
      let type = 'email';
      let senderNumber = '';

      if (fromEmail.endsWith('txt.voice.google.com')) {
        type = 'sms';
        // Extract phone number from headers or subject
        // E.g. subject: SMS from (240) 555-0199
        const phoneMatch = subjectHeader.match(/\d{9,}/) || subjectHeader.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
        senderNumber = phoneMatch ? phoneMatch[0] : '';
      } else if (fromEmail === 'voice-noreply@google.com') {
        if (subjectHeader.toLowerCase().includes('voicemail')) {
          type = 'voicemail';
        } else if (subjectHeader.toLowerCase().includes('missed')) {
          type = 'missed_call';
        }
        const phoneMatch = subjectHeader.match(/\d{9,}/) || subjectHeader.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
        senderNumber = phoneMatch ? phoneMatch[0] : '';
      }

      emails.push({
        id: msg.id,
        from: fromEmail,
        fromName: fromName || fromEmail,
        to: toHeader,
        subject: subjectHeader,
        body: snippet + (detail.data.payload?.body?.data ? '\n\n' + Buffer.from(detail.data.payload.body.data, 'base64').toString('utf8') : ''),
        date: new Date(dateHeader).toISOString(),
        isGoogleVoice,
        type,
        senderNumber
      });
    }

    let filteredEmails = [...emails];
    if (filter === 'email') {
      filteredEmails = filteredEmails.filter(e => !e.isGoogleVoice);
    } else if (filter === 'voice') {
      filteredEmails = filteredEmails.filter(e => e.isGoogleVoice);
    }

    return NextResponse.json({
      connected: true,
      emailAddress: 'recruit@libertydispatchers.com',
      emails: filteredEmails
    });

  } catch (error: any) {
    console.error('Error fetching live Gmail data:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch live Gmail data',
      emails: mockEmails, // Fallback to mock on connection error
      connected: false
    });
  }
}
