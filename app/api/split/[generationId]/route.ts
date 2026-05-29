import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { generationId: string } }) {
  try {
    const generation = await prisma.generation.findUnique({
      where: { id: params.generationId }
    });

    if (!generation || !generation.taskId) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // UPDATE: You mentioned Sonauto has a "Download Stems" option!
    // Simply uncomment this block and drop the actual undocumented API route here!
    
    // const sonautoRes = await fetch('https://api.sonauto.ai/v1/projects/' + generation.taskId + '/stems', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SONAUTO_API_KEY}`,
    //   }
    // });
    
    // if (!sonautoRes.ok) throw new Error("Sonauto Stem API Failed");

    // Mock an artificial delay to respect the UX workflow of an extraction wait state
    await new Promise(resolve => setTimeout(resolve, 2500));

    // After success, officially flag the DB so the dashboard unlocks the Stem distinct MP3 files
    const updated = await prisma.generation.update({
      where: { id: params.generationId },
      data: { stemStatus: 'ready' }
    });

    return NextResponse.json({ success: true, generation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
