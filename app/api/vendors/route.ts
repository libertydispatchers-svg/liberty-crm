import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, contactName, phone, whatsapp, email, businessType } = body;

    if (!businessName || !contactName || !phone || !email || !businessType) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    // Since we skipped Prisma push locally, we'll use Prisma to create the vendor.
    // If Prisma is not synced locally, this might throw a type error, but it will work in Vercel once Prisma db push runs.
    const newVendor = await (prisma as any).vendor.create({
      data: {
        businessName,
        contactName,
        phone,
        whatsapp: whatsapp || '',
        email,
        businessType,
        status: 'NEW',
      }
    });

    // Send Admin Notification Email
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_iYXGPr9j_B62PzR6fXYT7iFzQ211R3bSt';
      
      const adminHtmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0a84ff;">New Vendor Signup Alert 🚨</h2>
          <p>A new vendor has just registered via the website.</p>
          <ul>
            <li><strong>Business Name:</strong> ${businessName}</li>
            <li><strong>Contact Name:</strong> ${contactName}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>WhatsApp:</strong> ${whatsapp || 'None provided'}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Business Type:</strong> ${businessType}</li>
          </ul>
          <p>Please log in to the admin dashboard to review and contact them.</p>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${RESEND_API_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Liberty Dispatchers <onboarding@libertydispatch.xyz>',
          to: 'libertydispatchers@gmail.com',
          subject: \`🚨 New Vendor Signup: \${businessName}\`,
          html: adminHtmlBody
        })
      });

    } catch (emailErr) {
      console.error('Error sending admin notification for vendor:', emailErr);
    }

    return NextResponse.json({ success: true, vendorId: newVendor.id });
  } catch (error: any) {
    console.error('Vendor API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
