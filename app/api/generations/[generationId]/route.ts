import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { generationId: string } }) {
  try {
    const body = await req.json();
    const { title, vibe, crateId, key } = body;

    const updated = await prisma.generation.update({
      where: { id: params.generationId },
      data: {
        title: title || undefined,
        vibe: vibe || undefined,
        key: key || undefined,
        crateId: crateId || null, 
      }
    });

    return NextResponse.json({ success: true, generation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
