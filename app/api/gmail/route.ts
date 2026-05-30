import { NextResponse } from 'next/server';
import { getGmailClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

// Fallback Mock Data if environment variables are not configured yet


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
      return NextResponse.json({
        connected: false,
        error: 'Google API Credentials missing. Please add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to environment variables.',
        emails: []
      }, { status: 400 });
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
      emails: [],
      connected: false
    }, { status: 500 });
  }
}
