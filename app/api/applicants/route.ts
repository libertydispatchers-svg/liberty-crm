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
    const { name, phone, whatsapp, email, source, password } = body;

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
            whatsapp: whatsapp || null,
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
        const verifyUrl = `https://libertydispatch.xyz/api/auth/verify?token=${(applicant as any).verificationToken}&id=${applicant.id}`;
        const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_iYXGPDLy_D8qB1XdZeZjrMtGxFKZnukLa';

        const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0b131e;border-radius:14px;border:1px solid #0a84ff;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;">
      
      <!-- Header with logo -->
      <tr>
        <td style="background:linear-gradient(135deg,#0b131e 0%,#1a2332 100%);padding:28px 30px;text-align:center;border-bottom:2px solid #0a84ff;">
          <img src="https://libertydispatch.xyz/logo.jpg" alt="Liberty Dispatchers" style="max-height:60px;max-width:220px;object-fit:contain;display:block;margin:0 auto;" />
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px 36px;color:#f8fafc;">
          <h2 style="color:#0a84ff;margin:0 0 10px;font-size:1.4rem;text-align:center;">Confirm Your Email Address</h2>
          <p style="color:#94a3b8;text-align:center;margin:0 0 28px;font-size:0.9rem;">One quick step to unlock your driver application</p>
          
          <p style="color:#cbd5e1;margin:0 0 6px;">Hi <strong style="color:#fff;">${name}</strong>,</p>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 28px;">
            Thanks for applying to Liberty Dispatchers! Click the button below to verify your email and access your onboarding documents. This link expires in <strong style="color:#0a84ff;">24 hours</strong>.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td align="center">
                <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0a84ff 0%,#e30022 100%);color:#ffffff;padding:15px 36px;text-decoration:none;border-radius:8px;font-weight:800;font-size:1rem;letter-spacing:0.02em;">
                  ✅ Verify My Email &amp; Start Onboarding
                </a>
              </td>
            </tr>
          </table>

          <!-- What to expect -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#0a84ff;font-weight:700;margin:0 0 12px;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;">What happens next</p>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;color:#94a3b8;font-size:0.88rem;">📋 &nbsp;Review and sign your Driver Agreement</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;font-size:0.88rem;">📍 &nbsp;Set your coverage area and availability</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;font-size:0.88rem;">🚗 &nbsp;Tell us about your vehicle and experience</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;font-size:0.88rem;">🎉 &nbsp;Get added to the dispatch grid!</td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Fallback link -->
          <p style="color:#64748b;font-size:0.78rem;line-height:1.6;margin:0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}" style="color:#0a84ff;word-break:break-all;">${verifyUrl}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 36px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
          <p style="margin:0;font-size:0.75rem;color:#475569;">
            Liberty Dispatchers &nbsp;·&nbsp; <a href="mailto:apply@libertydispatch.xyz" style="color:#64748b;text-decoration:none;">apply@libertydispatch.xyz</a>
          </p>
          <p style="margin:6px 0 0;font-size:0.7rem;color:#334155;">If you didn't sign up for Liberty Dispatchers, you can safely ignore this email.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0a84ff;">New Driver Signup Alert 🚨</h2>
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
