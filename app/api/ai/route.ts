import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt, messages, model } = await req.json();

    const result = await streamText({
      // Pass the string model directly so Vercel's native Gateway interception works via VERCEL_OIDC_TOKEN
      model: model || 'openai/gpt-4o',
      messages,
      prompt: prompt || (messages ? undefined : 'Invent a new holiday and describe its traditions.'),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('AI Gateway Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to communicate with AI Gateway' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

