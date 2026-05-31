import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fallback to provided token for immediate functionality
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8884600978:AAGyFWMOs2Bo8ApFnVahbdkt-6dv_EO-J_0';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function GET(request: Request) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Failed to fetch Telegram updates', connected: false }, { status: 400 });
    }

    // Extract unique chat sessions and their messages
    const messages = data.result || [];
    const chatsMap = new Map();

    for (const update of messages) {
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat.id;
        
        if (!chatsMap.has(chatId)) {
          chatsMap.set(chatId, {
            chatId,
            firstName: msg.chat.first_name || '',
            lastName: msg.chat.last_name || '',
            username: msg.chat.username || '',
            messages: []
          });
        }
        
        chatsMap.get(chatId).messages.push({
          messageId: msg.message_id,
          text: msg.text || (msg.photo ? '[Photo]' : '[Attachment]'),
          date: msg.date * 1000,
          sender: 'user'
        });
      }
    }

    const chats = Array.from(chatsMap.values());
    return NextResponse.json({ connected: true, chats });

  } catch (error: any) {
    console.error('Error fetching Telegram data:', error);
    return NextResponse.json({ error: error.message || 'Failed to connect to Telegram', connected: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, text } = body;

    if (!chatId || !text) {
      return NextResponse.json({ error: 'chatId and text are required' }, { status: 400 });
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Failed to send message' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: data.result });

  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send Telegram message' }, { status: 500 });
  }
}
