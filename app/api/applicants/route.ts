import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MOCK_APPLICANTS } from '../../../lib/mockApplicants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';

  try {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }
    if (source) {
      whereClause.source = source;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applicants = await prisma.applicant.findMany({
      where: whereClause,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applicants);
  } catch (error: any) {
    console.error('Prisma database connection failed in applicants API:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, source } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 });
    }

    try {
      // Create the applicant, default documents, and initial note in a single transaction
      const applicant = await prisma.$transaction(async (tx) => {
        const appObj = await tx.applicant.create({
          data: {
            name,
            phone,
            email,
            source: source || 'EMAIL',
            status: 'NEW',
            availability: JSON.stringify({
              monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            }),
            notes: {
              create: {
                content: `Applicant profile created. Source: ${source || 'EMAIL'}`,
              }
            },
            documents: {
              create: [
                { name: 'Onboarding Material', status: 'NOT_SENT' },
                { name: 'Driver Contract', status: 'NOT_SENT' },
              ]
            }
          },
          include: {
            notes: true,
            documents: true,
          }
        });
        return appObj;
      });

      try {
        const { syncToSheets } = require('../../../lib/sheets');
        await syncToSheets();
      } catch (err) {
        console.error('Failed to sync to sheets in POST applicant:', err);
      }

      return NextResponse.json(applicant);
    } catch (error: any) {
      console.error('Prisma database connection failed during POST:', error);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error handling POST applicant request:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
