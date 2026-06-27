import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getGmailClient } from '../../../../../lib/google';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find all ACTIVE drivers
    const activeDrivers = await prisma.applicant.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeDrivers.length === 0) {
      return NextResponse.json({ success: true, message: 'No active drivers to notify' });
    }

    // Try to send an email blast
    let sentCount = 0;
    try {
      const gmail = getGmailClient();
      
      for (const driver of activeDrivers) {
        if (!driver.email) continue;
        
        const htmlBody = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b131e; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #0a84ff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://libertydispatch.xyz/logo.jpg" alt="Liberty Dispatchers" style="max-width: 200px; height: auto;" />
          </div>
          <h2 style="color: #0a84ff; text-align: center;">New Dispatch Job Available!</h2>
          <p>Hi ${driver.name},</p>
          <p>A new job has just been posted in your area that matches your vehicle type.</p>
          
          <div style="background: #112238; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #1a3a5f;">
            <h3 style="margin-top: 0; color: #f8fafc;">${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Pickup:</strong> ${job.pickupAddress}</p>
            <p><strong>Dropoff:</strong> ${job.dropoffAddress}</p>
            <p><strong>Payout:</strong> <span style="color: #10b981; font-weight: bold; font-size: 1.1em;">${job.payout}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.libertydispatch.xyz" style="background: linear-gradient(135deg, #0a84ff 0%, #e30022 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Contact dispatch immediately or log in to your portal if you are available to take this run!</p>
        </div>
        `;
        
        const emailLines = [
          `To: ${driver.email}`,
          `Subject: New Job Alert: ${job.title} - ${job.payout}`,
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
        sentCount++;
      }
    } catch (emailErr) {
      console.error('Failed to send notifications:', emailErr);
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Notify Error:', error);
    return NextResponse.json({ error: 'Failed to notify drivers' }, { status: 500 });
  }
}
