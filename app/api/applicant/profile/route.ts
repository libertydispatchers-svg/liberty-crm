import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'liberty-dispatch-fallback-secret-32-chars-long'
);

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tokenStr = cookie.split('; ').find(c => c.startsWith('applicant_token='));
    if (!tokenStr) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = tokenStr.split('=')[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const applicant = await prisma.applicant.findUnique({
      where: { id: payload.sub as string },
      include: { documents: true }
    });
    
    if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    
    return NextResponse.json({ 
      id: applicant.id, 
      name: applicant.name, 
      email: applicant.email, 
      phone: applicant.phone,
      status: applicant.status,
      availability: applicant.availability,
      documents: applicant.documents
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const tokenStr = cookie.split('; ').find(c => c.startsWith('applicant_token='));
    if (!tokenStr) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = tokenStr.split('=')[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const body = await request.json();
    const { name, phone, availability, coverageAddress, coverageRadius, vehicleType } = body;

    const applicant = await prisma.applicant.update({
      where: { id: payload.sub as string },
      data: {
        name,
        phone,
        availability: availability ? JSON.stringify(availability) : undefined
      },
      include: { documents: true }
    });

    // Update the Onboarding Material document's esignData
    if (coverageAddress || coverageRadius || vehicleType) {
      const onboardDoc = applicant.documents.find(d => d.name === 'Onboarding Material');
      let esignData: any = {};
      if (onboardDoc && onboardDoc.esignData) {
        try { 
          const parsed = JSON.parse(onboardDoc.esignData);
          if (parsed && typeof parsed === 'object') {
            esignData = parsed;
          }
        } catch(e) {}
      }
      if (coverageAddress) (esignData as any).coverageAddress = coverageAddress;
      if (coverageRadius) (esignData as any).coverageRadius = coverageRadius;
      if (vehicleType) (esignData as any).vehicleType = vehicleType;

      if (onboardDoc) {
        await prisma.document.update({
          where: { id: onboardDoc.id },
          data: {
            esignData: JSON.stringify(esignData)
          }
        });
      } else {
        await prisma.document.create({
          data: {
            name: 'Onboarding Material',
            applicantId: payload.sub as string,
            status: 'PENDING',
            esignData: JSON.stringify(esignData)
          }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating applicant profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
