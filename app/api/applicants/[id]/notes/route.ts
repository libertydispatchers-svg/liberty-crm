import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        applicantId: params.id,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: error.message || 'Failed to add note' }, { status: 500 });
  }
}
