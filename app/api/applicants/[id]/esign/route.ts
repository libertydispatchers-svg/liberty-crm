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

    const applicant = await prisma.applicant.findUnique({
      where: { id: params.id },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Capture signature IP metadata
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    await prisma.$transaction(async (tx) => {
      // 1. Update applicant availability and status
      await tx.applicant.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE', // Mark as active driver now that onboarding is complete
          availability: JSON.stringify(availability),
        },
      });

      // 2. Mark documents as SIGNED and save metadata
      const now = new Date();

      // Onboarding Material (Questionnaire answers stored as JSON in esignData)
      await tx.document.updateMany({
        where: { applicantId: params.id, name: 'Onboarding Material' },
        data: {
          status: 'SIGNED',
          signedAt: now,
          fileUrl: '#/docs/onboarding',
          esignData: intakeData ? JSON.stringify(intakeData) : null,
        },
      });



      // Driver Contract
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

      // Format Intake Questionnaire note content for admin reference
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

      // 3. Log a detailed interaction note
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

    return NextResponse.json({ success: true, message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error('Error submitting e-sign onboarding:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit onboarding documents' }, { status: 500 });
  }
}
