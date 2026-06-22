import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedDriver: {
          select: { id: true, name: true, phone: true }
        }
      }
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, company, pickupAddress, dropoffAddress, payout } = body;
    
    if (!title || !pickupAddress || !dropoffAddress || !payout) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        company: company || 'Liberty Dispatchers',
        pickupAddress,
        dropoffAddress,
        payout,
        status: 'OPEN'
      }
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
