import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedDriverId !== undefined) {
      updateData.assignedDriverId = body.assignedDriverId;
      if (body.assignedDriverId && !body.status) {
        updateData.status = 'ASSIGNED';
      } else if (!body.assignedDriverId && !body.status) {
        updateData.status = 'OPEN';
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        assignedDriver: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
