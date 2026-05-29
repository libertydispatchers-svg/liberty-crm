import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      }
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json(applicant);
  } catch (error: any) {
    console.error('Error fetching applicant detail:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch applicant' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, phone, email, status, availability, docAction, docName } = body;

    // Fetch existing applicant to check status change
    const existing = await prisma.applicant.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const updateData: any = {};
    const notesToCreate: any[] = [];

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (availability) updateData.availability = availability;

    if (status && status !== existing.status) {
      updateData.status = status;
      notesToCreate.push({
        content: `Status updated to ${status}`
      });
    }

    // Handle onboarding link generation and status updates
    if (docAction && docName) {
      const doc = await prisma.document.findFirst({
        where: { applicantId: params.id, name: docName }
      });

      if (doc) {
        if (docAction === 'SEND') {
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          });
          notesToCreate.push({
            content: `Sent e-sign request for: ${docName}`
          });
        }
      }
    }

    const updatedApplicant = await prisma.$transaction(async (tx) => {
      // Create notes if any status changes occurred
      if (notesToCreate.length > 0) {
        await tx.note.createMany({
          data: notesToCreate.map(n => ({
            content: n.content,
            applicantId: params.id
          }))
        });
      }

      return await tx.applicant.update({
        where: { id: params.id },
        data: updateData,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' }
          },
          documents: true
        }
      });
    });

    return NextResponse.json(updatedApplicant);
  } catch (error: any) {
    console.error('Error updating applicant:', error);
    return NextResponse.json({ error: error.message || 'Failed to update applicant' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.applicant.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Applicant deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting applicant:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete applicant' }, { status: 500 });
  }
}
