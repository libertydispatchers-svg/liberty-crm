import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Initialize the OpenAI provider. 
// Vercel will automatically authenticate this in production using the VERCEL_OIDC_TOKEN if configured.
const openai = createOpenAI({
  compatibility: 'strict', // strict mode for OpenAI API
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt, messages, model } = await req.json();

    // Use the model provided by the client, or default to gpt-4o
    // The user originally asked for 'openai/gpt-5.5', so we strip the provider prefix if present
    const modelName = model?.replace('openai/', '') || 'gpt-4o';

    const result = await streamText({
      model: openai(modelName),
      messages,
      prompt: prompt || (messages ? undefined : 'Explain quantum computing in simple terms.'),
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
