import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const generations = await prisma.generation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return NextResponse.json({ generations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
