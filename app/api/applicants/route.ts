import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { MOCK_APPLICANTS } from '../../../lib/mockApplicants';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { getGmailClient } from '../../../lib/google';
import { randomBytes } from 'crypto';

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
    // Any Firebase failure — quota, credentials, billing — fall back to Google Sheets
    console.warn('Firebase read failed, falling back to Google Sheets:', error?.message);
    try {
      const { getSheetsClient } = require('../../../lib/google');
      const sheets = getSheetsClient();
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      if (!spreadsheetId) throw new Error('No sheet id configured');
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
      const targetSheet = sheetMeta.data.sheets?.[0]?.properties?.title || 'Sheet1';
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${targetSheet}!A2:I500`,
      });
      const rows: string[][] = res.data.values || [];
      const applicants = rows
        .filter((r: string[]) => r[1] && r[1].trim() !== '')
        .map((r: string[]) => ({
          id: r[1] || '',
          name: r[2] || '',
          phone: r[3] || '',
          email: r[4] || '',
          status: r[5] || 'NEW',
          source: r[6] || 'WEBSITE',
          notes: [],
          documents: [],
          createdAt: r[8] ? new Date(r[8]).toISOString() : new Date().toISOString(),
        }));
      return NextResponse.json(applicants);
    } catch (sheetErr) {
      console.error('Sheets fallback also failed:', sheetErr);
    }
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
            emailVerified: false,
            verificationToken: randomBytes(32).toString('hex'),
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
        const { appendApplicantToSheets } = require('../../../lib/sheets');
        await appendApplicantToSheets({
          id: applicant.id,
          name: applicant.name,
          phone: applicant.phone,
          email: applicant.email,
          status: applicant.status,
          source: applicant.source,
          createdAt: applicant.createdAt,
        });
      } catch (err) {
        console.error('Failed to append to sheets in POST applicant:', err);
      }

      // Send Email Verification Magic Link
      try {
        const verifyUrl = `https://libertydispatch.xyz/verify-email?token=${applicant.verificationToken}&id=${applicant.id}`;
        const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_iYXGPDLy_D8qB1XdZeZjrMtGxFKZnukLa';

        const htmlBody = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b131e; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #d7b55f;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ffffff; margin: 0;">Liberty Dispatchers</h1>
          </div>
          <h2 style="color: #d7b55f; text-align: center;">Confirm Your Email Address</h2>
          <p>Hi ${name},</p>
          <p>Thanks for applying! One quick step — please confirm your email address to unlock your onboarding documents.</p>
          <p>This link expires in <strong>24 hours</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #d7b55f 0%, #a8262a 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 1rem;">✅ Verify My Email &amp; Start Onboarding</a>
          </div>
          <p style="font-size: 0.85rem; color: #94a3b8;">If you didn't sign up, you can safely ignore this email.</p>
        </div>
        `;

        // Send verification email to applicant
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Liberty Dispatchers <apply@libertydispatch.xyz>',
            to: [email],
            reply_to: 'libertydispatchers@gmail.com',
            subject: '✅ Confirm your email — Liberty Dispatchers',
            html: htmlBody
          })
        });

        // 2. Send Admin Notification Email
        let adminEmail = 'libertydispatchers@gmail.com';
        try {
          const gmail = getGmailClient();
          const adminEmailResponse = await gmail.users.getProfile({ userId: 'me' }).catch(() => null);
          if (adminEmailResponse?.data?.emailAddress) {
            adminEmail = adminEmailResponse.data.emailAddress;
          }
        } catch (e) {
          // Fallback if Gmail fails
        }
        
        const adminHtmlBody = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #a8262a;">New Driver Signup Alert 🚨</h2>
          <p>A new applicant has just registered via the website.</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Source:</strong> ${source || 'WEBSITE'}</li>
          </ul>
          <p>Log in to the CRM Admin Dashboard to view their profile and onboarding status.</p>
        </div>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Liberty Dispatchers <apply@libertydispatch.xyz>',
            to: [adminEmail],
            subject: `New Driver Signup: ${name}`,
            html: adminHtmlBody
          })
        });

      } catch (emailErr) {
        console.error('Failed to send emails via Resend:', emailErr);
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
