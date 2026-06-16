import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'liberty-dispatch-fallback-secret-32-chars-long'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const applicant = await prisma.applicant.findFirst({
      where: { email: email.toLowerCase().trim() }
    });

    if (!applicant || !applicant.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials or account not set up' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, applicant.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT
    const token = await new SignJWT({ sub: applicant.id, email: applicant.email, role: 'applicant' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, id: applicant.id, name: applicant.name });
    
    // Set cookie
    response.cookies.set('applicant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return NextResponse.json({ authenticated: false });
    
    const tokenStr = cookie.split('; ').find(c => c.startsWith('applicant_token='));
    if (!tokenStr) return NextResponse.json({ authenticated: false });

    const token = tokenStr.split('=')[1];
    
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      const applicant = await prisma.applicant.findUnique({
        where: { id: payload.sub as string }
      });
      
      if (!applicant) return NextResponse.json({ authenticated: false });
      
      return NextResponse.json({ 
        authenticated: true, 
        user: { id: applicant.id, name: applicant.name, email: applicant.email, status: applicant.status }
      });
    } catch (e) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('applicant_token');
  return response;
}
