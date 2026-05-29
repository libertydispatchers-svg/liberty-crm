import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { generationId: string } }) {
  try {
    const generation = await prisma.generation.findUnique({
      where: { id: params.generationId },
    });

    if (!generation || !generation.taskId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (generation.status === 'ready') {
       return NextResponse.json({ status: 'SUCCESS' });
    }

    // Proxy the status call to Sonauto to keep the API key safe
    const res = await fetch(`https://api.sonauto.ai/v1/generations/${generation.taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SONAUTO_API_KEY}`
      }
    });

    if (!res.ok) {
       return NextResponse.json({ error: 'Failed to proxy status' }, { status: 500 });
    }

    const data = await res.json();
    
    // If successful, update the database so we have the beatUrl and mark as ready!
    if (data.status === 'SUCCESS' && data.song_paths && data.song_paths.length > 0) {
       await prisma.generation.update({
          where: { id: generation.id },
          data: {
             status: 'ready',
             beatUrl: data.song_paths[0]
          }
       });
    }

    return NextResponse.json({ status: data.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
