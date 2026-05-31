import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getGmailClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    if (!hasCreds) {
      return NextResponse.json({ error: 'Google API Credentials missing' }, { status: 400 });
    }

    const gmail = getGmailClient();
    
    // Fetch recent emails
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'label:INBOX',
      maxResults: 20
    });

    const messages = listRes.data.messages || [];
    let syncedCount = 0;

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
      const snippet = detail.data.snippet || '';

      let fromName = fromHeader;
      let fromEmail = fromHeader;
      const emailRegex = /<([^>]+)>/;
      const match = fromHeader.match(emailRegex);
      if (match) {
        fromEmail = match[1];
        fromName = fromHeader.split('<')[0].trim().replace(/"/g, '');
      }

      // Determine Google Voice type
      const isGoogleVoice = fromEmail.endsWith('txt.voice.google.com') || fromEmail === 'voice-noreply@google.com';
      let type = 'EMAIL';
      let senderNumber = '';

      if (fromEmail.endsWith('txt.voice.google.com')) {
        type = 'TEXT';
        const phoneMatch = subjectHeader.match(/\d{9,}/) || subjectHeader.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
        senderNumber = phoneMatch ? phoneMatch[0] : '';
      } else if (fromEmail === 'voice-noreply@google.com') {
        type = 'CALL';
        const phoneMatch = subjectHeader.match(/\d{9,}/) || subjectHeader.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
        senderNumber = phoneMatch ? phoneMatch[0] : '';
      }

      // Search DB to see if candidate already exists
      const phoneFilter = senderNumber ? senderNumber.replace(/\D/g, '') : null;
      
      let existingApplicant = null;
      
      if (isGoogleVoice && phoneFilter) {
        // Search by phone if it's a voice/sms
        existingApplicant = await prisma.applicant.findFirst({
          where: {
            phone: { contains: phoneFilter }
          }
        });
      } else if (!isGoogleVoice && fromEmail) {
        // Ignore automated google emails and spam marketing
        const spamFilters = ['google.com', 'noreply', 'temu', 'github', 'marketing', 'support@', 'creativefabrica', 'newsletter', 'updates'];
        if (spamFilters.some(f => fromEmail.toLowerCase().includes(f))) continue;

        // Search by email
        existingApplicant = await prisma.applicant.findFirst({
          where: {
            email: fromEmail
          }
        });
      }

      // If not found, create new applicant
      if (!existingApplicant) {
        await prisma.$transaction(async (tx) => {
          await tx.applicant.create({
            data: {
              name: fromName || (senderNumber ? `Applicant ${senderNumber}` : 'Unknown Candidate'),
              phone: senderNumber || 'N/A',
              email: isGoogleVoice ? `${senderNumber}@voice.google.com` : fromEmail,
              source: type,
              status: 'NEW',
              availability: JSON.stringify({
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
              }),
              notes: {
                create: {
                  content: `Automatically synced from Inbox (${type})`,
                }
              },
              documents: {
                create: [
                  { name: 'Onboarding Material', status: 'NOT_SENT' },
                  { name: 'W-9 Form', status: 'NOT_SENT' },
                  { name: 'Driver Contract', status: 'NOT_SENT' },
                ]
              }
            }
          });
        });
        syncedCount++;
      } else if (isGoogleVoice) {
        // Log the message as a note for the existing applicant
        await prisma.note.create({
          data: {
            content: type === 'TEXT' ? `Received Text: ${snippet || '(No body)'}` : `Call Log: ${subjectHeader}`,
            applicantId: existingApplicant.id
          }
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, syncedCount });
  } catch (error: any) {
    console.error('Error syncing inbox:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync inbox' }, { status: 500 });
  }
}
