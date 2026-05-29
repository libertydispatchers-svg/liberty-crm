import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const crates = await prisma.crate.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ crates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    const crate = await prisma.crate.create({ data: { name } });
    return NextResponse.json({ success: true, crate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
