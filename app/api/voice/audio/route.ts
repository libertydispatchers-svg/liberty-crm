import { NextResponse } from 'next/server';
import { getGmailClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const attachmentId = searchParams.get('attachmentId');

    if (!messageId || !attachmentId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const gmail = getGmailClient();
    const res = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    });

    if (!res.data.data) {
      return NextResponse.json({ error: 'Audio data not found' }, { status: 404 });
    }

    // Gmail API returns attachment data as base64url encoded
    const audioBuffer = Buffer.from(res.data.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': audioBuffer.length.toString(),
      }
    });
  } catch (error: any) {
    console.error('Error fetching voicemail audio:', error);
    return NextResponse.json({ error: 'Failed to fetch voicemail' }, { status: 500 });
  }
}
