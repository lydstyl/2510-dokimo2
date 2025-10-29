import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { UpdateLease } from '@/use-cases/UpdateLease';
import { DeleteLease } from '@/use-cases/DeleteLease';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await params;

    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
        property: {
          include: {
            landlord: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 24,
        },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Verify the user has access to this lease (through landlord)
    if (lease.property.landlord.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error('Error fetching lease:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await params;
    const body = await request.json();
    const { propertyId, tenantId, startDate, endDate, rentAmount, chargesAmount, paymentDueDay, irlQuarter } = body;

    if (!propertyId || !tenantId || !startDate || rentAmount === undefined || chargesAmount === undefined || !paymentDueDay) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const repository = new PrismaLeaseRepository(prisma);
    const useCase = new UpdateLease(repository);

    const lease = await useCase.execute({
      id: leaseId,
      propertyId,
      tenantId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      rentAmount: Number(rentAmount),
      chargesAmount: Number(chargesAmount),
      paymentDueDay: Number(paymentDueDay),
      irlQuarter: irlQuarter || undefined,
    });

    return NextResponse.json({
      id: lease.id,
      propertyId: lease.propertyId,
      tenantId: lease.tenantId,
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount.getValue(),
      chargesAmount: lease.chargesAmount.getValue(),
      totalAmount: lease.totalAmount.getValue(),
      paymentDueDay: lease.paymentDueDay,
      irlQuarter: lease.irlQuarter,
      createdAt: lease.createdAt,
      updatedAt: lease.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating lease:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Lease not found' ? 404 : 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await params;

    const repository = new PrismaLeaseRepository(prisma);
    const useCase = new DeleteLease(repository);

    await useCase.execute(leaseId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting lease:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Lease not found' ? 404 : 400 }
    );
  }
}
