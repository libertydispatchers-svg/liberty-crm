import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'liberty-dispatch-fallback-secret-32-chars-long'
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  if (!token || !id) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
  }

  try {
    // Find the applicant and check the token
    const applicant = await prisma.applicant.findUnique({ where: { id } });

    if (!applicant) {
      return NextResponse.redirect(new URL('/verify-email?error=notfound', request.url));
    }

    if ((applicant as any).emailVerified) {
      // Already verified — just send them to onboarding
      return NextResponse.redirect(new URL(`/esign/${id}`, request.url));
    }

    if ((applicant as any).verificationToken !== token) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    // Mark as verified
    await prisma.applicant.update({
      where: { id },
      data: {
        emailVerified: true,
        verificationToken: null,
      } as any,
    });

    // Issue a JWT and set cookie so they are auto-logged in
    const jwtToken = await new SignJWT({ sub: applicant.id, email: applicant.email, role: 'applicant' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.redirect(new URL(`/esign/${id}`, request.url));
    response.cookies.set('applicant_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/verify-email?error=server', request.url));
  }
}
