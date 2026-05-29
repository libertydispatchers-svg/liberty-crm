import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { prompt, userId, folderId, bpm } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const useV2 = !!bpm;
    const url = useV2 ? 'https://api.sonauto.ai/v1/generations/v2' : 'https://api.sonauto.ai/v1/generations/v3';

    // Inject hardcore instrumental modifiers so Sonauto never outputs vocals
    const finalPrompt = `${prompt}, No words, No Lyrics, Instrumental`;

    const bodyObj: any = {
      prompt: finalPrompt,
      instrumental: true, // Typebeat generator
      num_songs: 1,
    };
    if (useV2 && bpm) bodyObj.bpm = Number(bpm);

    // Call Sonauto API pointing to generation endpoint
    const sonautoRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SONAUTO_API_KEY}`,
      },
      body: JSON.stringify(bodyObj),
    });

    if (!sonautoRes.ok) {
      const errorText = await sonautoRes.text();
      throw new Error(`Sonauto API failed: ${errorText}`);
    }

    const taskData = await sonautoRes.json();
    const taskId = taskData.task_id;
    
    // Save initial Generation object to DB waiting for async polling
    const generation = await prisma.generation.create({
      data: {
        prompt,
        taskId,
        bpm: bpm ? Number(bpm) : undefined,
        userId: userId || undefined,
        folderId: folderId || undefined,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, generation });
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
