import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/prisma';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { generationId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const stemName = searchParams.get('stem');

    const generation = await prisma.generation.findUnique({
      where: { id: params.generationId },
    });

    if (!generation || !generation.beatUrl) {
      return new NextResponse('Audio Not Found', { status: 404 });
    }

    // Fetch the audio from the source
    const audioRes = await fetch(generation.beatUrl);

    if (!audioRes.ok) {
      return new NextResponse('Failed to fetch audio', { status: 502 });
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="audio_${generation.id}${stemName ? `_${stemName}` : ''}.mp3"`,
      },
    });
  } catch (error) {
    console.error('Audio Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
