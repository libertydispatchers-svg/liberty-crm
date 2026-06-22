import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MOCK_APPLICANTS } from '../../../lib/mockApplicants';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { getGmailClient } from '../../../lib/google';

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
      let cleanSearch = search.replace(/\D/g, '');
      if (cleanSearch.startsWith('1') && cleanSearch.length === 11) {
        cleanSearch = cleanSearch.substring(1);
      }
      
      const orConditions: any[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
      
      if (cleanSearch.length > 0) {
        orConditions.push({ phone: { contains: cleanSearch, mode: 'insensitive' } });
        
        if (cleanSearch.length === 10) {
          const formatted1 = `(${cleanSearch.slice(0,3)}) ${cleanSearch.slice(3,6)}-${cleanSearch.slice(6)}`;
          const formatted2 = `${cleanSearch.slice(0,3)}-${cleanSearch.slice(3,6)}-${cleanSearch.slice(6)}`;
          orConditions.push({ phone: { contains: formatted1, mode: 'insensitive' } });
          orConditions.push({ phone: { contains: formatted2, mode: 'insensitive' } });
        }
      }
      whereClause.OR = orConditions;
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
    const { name, phone, email, source, password } = body;

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: 'Name, phone, email, and password are required' }, { status: 400 });
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create the applicant, default documents, and initial note in a single transaction
      const applicant = await prisma.$transaction(async (tx) => {
        const appObj = await tx.applicant.create({
          data: {
            name,
            phone,
            email,
            passwordHash,
            source: source || 'WEBSITE',
            status: 'NEW',
            availability: JSON.stringify({
              monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            }),
            notes: {
              create: {
                content: `Applicant profile created via website.`,
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

      // Send Verification/Welcome Email
      try {
        const gmail = getGmailClient();
        const htmlBody = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b131e; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #d7b55f;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ffffff; margin: 0;">Liberty Dispatchers</h1>
          </div>
          <h2 style="color: #d7b55f; text-align: center;">Verify Your Email & Complete Onboarding</h2>
          <p>Hi ${name},</p>
          <p>Welcome to Liberty Dispatchers! We've successfully received your initial registration.</p>
          <p>Please log in to your portal to complete your onboarding documents so we can get you approved and added to the grid.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://libertydispatch.xyz" style="background: linear-gradient(135deg, #d7b55f 0%, #a8262a 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Portal</a>
          </div>
        </div>
        `;
        const emailLines = [
          `To: ${email}`,
          `Subject: Verify Email - Welcome to Liberty Dispatchers!`,
          `Content-Type: text/html; charset=utf-8`,
          `MIME-Version: 1.0`,
          ``,
          htmlBody
        ];
        const rawEmail = Buffer.from(emailLines.join('\r\n'))
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: rawEmail }
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }

      // Auto login after sign up
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'liberty-dispatch-fallback-secret-32-chars-long'
      );
      const token = await new SignJWT({ sub: applicant.id, email: applicant.email, role: 'applicant' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      const response = NextResponse.json(applicant);
      response.cookies.set('applicant_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return response;
    } catch (error: any) {
      console.error('Prisma database connection failed during POST:', error);
      return NextResponse.json({ error: 'Database connection failed or email already registered' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error handling POST applicant request:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
