import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { signature, availability, intakeData } = body;

    if (!signature) {
      return NextResponse.json({ error: 'Signature is required to sign the contract' }, { status: 400 });
    }

    let applicant: any = null;
    try {
      applicant = await prisma.applicant.findUnique({
        where: { id: params.id },
      });
    } catch (e: any) {
      console.warn('Skipping applicant check due to db read limits', e);
      applicant = { id: params.id };
    }

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    await prisma.$transaction(async (tx) => {
      await tx.applicant.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE',
          availability: JSON.stringify(availability),
        },
      });

      const now = new Date();

      await tx.document.updateMany({
        where: { applicantId: params.id, name: 'Onboarding Material' },
        data: {
          status: 'SIGNED',
          signedAt: now,
          fileUrl: '#/docs/onboarding',
          esignData: intakeData ? JSON.stringify(intakeData) : null,
        },
      });

      await tx.document.updateMany({
        where: { applicantId: params.id, name: 'Driver Contract' },
        data: {
          status: 'SIGNED',
          signedAt: now,
          fileUrl: '#/docs/contract',
          esignData: JSON.stringify({
            signature,
            ipAddress,
            signedAt: now.toISOString(),
          }),
        },
      });

      let intakeNote = '';
      if (intakeData) {
        intakeNote = `\n\nIntake Questionnaire Answers:\n` +
          `- Vehicle Type: ${intakeData.vehicleType}\n` +
          `- Coverage Area: ${intakeData.coverageArea}\n` +
          `- Desired Distance: ${intakeData.desiredDistance}\n` +
          `- Shift Preference: ${intakeData.shiftPreference}\n` +
          `- Charging Stations Help: ${intakeData.chargingStationsHelp}\n` +
          `- Charging Stations Worth: ${intakeData.chargingStationsWorth}\n` +
          `- Payout Method: ${intakeData.payoutMethod} (${intakeData.payoutDetails})\n` +
          `- OK with Daily Payouts: ${intakeData.dailyPayoutsOk}\n` +
          `- Current Apps: ${intakeData.currentApps}\n` +
          `- Experience Notes: ${intakeData.experience || 'None'}`;
      }

      await tx.note.create({
        data: {
          content: `Onboarding completed! Driver signed Driver Contract. Signature: "${signature}" from IP ${ipAddress}. Weekly availability hours have been updated.${intakeNote}`,
          applicantId: params.id,
        },
      });
    });

    // Sync to Sheets
    try {
      const { syncToSheets } = require('../../../../../lib/sheets');
      await syncToSheets();
    } catch (err) {
      console.error('Failed to sync to sheets in POST esign:', err);
    }

    // Send admin notification email about completed onboarding
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_iYXGPDLy_D8qB1XdZeZjrMtGxFKZnukLa';
      const driverName = applicant?.name || 'A driver';
      const driverPhone = applicant?.phone || 'N/A';
      const driverEmail = applicant?.email || 'N/A';

      const intakeRows = intakeData ? [
        ['Vehicle Type', intakeData.vehicleType],
        ['Coverage Area', intakeData.coverageArea],
        ['Desired Distance', intakeData.desiredDistance],
        ['Shift Preference', intakeData.shiftPreference],
        ['Payout Method', `${intakeData.payoutMethod} (${intakeData.payoutDetails})`],
        ['Daily Pay Required?', intakeData.dailyPayoutsOk],
        ['Current Apps', intakeData.currentApps],
        ['Experience', intakeData.experience || 'None'],
      ].map(([label, val]) => `<tr><td style="padding:6px 12px;color:#94a3b8;font-size:0.85rem;">${label}</td><td style="padding:6px 12px;color:#f8fafc;font-weight:600;font-size:0.85rem;">${val || '—'}</td></tr>`).join('') : '';

      const adminHtml = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#0b131e;color:#f8fafc;padding:0;border-radius:12px;border:1px solid #d7b55f;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#d7b55f,#a8262a);padding:20px 30px;text-align:center;">
          <img src="https://libertydispatch.xyz/logo.png" alt="Liberty Dispatchers" style="max-height:50px;max-width:200px;object-fit:contain;" />
        </div>
        <div style="padding:28px 30px;">
          <h2 style="color:#d7b55f;margin:0 0 8px;">🎉 Onboarding Complete!</h2>
          <p style="color:#94a3b8;margin:0 0 20px;font-size:0.9rem;">A driver has fully completed their application and signed their contract.</p>
          <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.04);border-radius:8px;overflow:hidden;margin-bottom:20px;">
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:0.85rem;">Name</td><td style="padding:6px 12px;color:#f8fafc;font-weight:600;font-size:0.85rem;">${driverName}</td></tr>
            <tr style="background:rgba(255,255,255,0.03);"><td style="padding:6px 12px;color:#94a3b8;font-size:0.85rem;">Phone</td><td style="padding:6px 12px;color:#f8fafc;font-weight:600;font-size:0.85rem;">${driverPhone}</td></tr>
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:0.85rem;">Email</td><td style="padding:6px 12px;color:#f8fafc;font-weight:600;font-size:0.85rem;">${driverEmail}</td></tr>
            ${intakeRows}
          </table>
          <div style="text-align:center;">
            <a href="https://libertydispatch.xyz/admin" style="background:linear-gradient(135deg,#d7b55f,#a8262a);color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:0.95rem;">View in Dashboard</a>
          </div>
        </div>
        <div style="padding:16px 30px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
          <p style="margin:0;font-size:0.75rem;color:#475569;">Liberty Dispatchers · apply@libertydispatch.xyz</p>
        </div>
      </div>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Liberty Dispatchers <apply@libertydispatch.xyz>',
          to: ['libertydispatchers@gmail.com'],
          reply_to: 'libertydispatchers@gmail.com',
          subject: `🎉 Onboarding Complete: ${driverName}`,
          html: adminHtml,
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send onboarding completion email:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error('Error submitting e-sign onboarding:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit onboarding documents' }, { status: 500 });
  }
}
