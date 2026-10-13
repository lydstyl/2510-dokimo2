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
        tenants: {
          include: {
            tenant: true,
          },
        },
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

    // `tenants` keeps exposing the join rows (composite id `<leaseId>_<tenantId>`)
    // for existing clients. `tenantIds` exposes the ids the PATCH route expects:
    // sending the composite ids back as tenantIds is what wiped a lease on
    // 13/10/2026, so give callers an unambiguous source.
    return NextResponse.json({
      ...lease,
      tenantIds: lease.tenants.map((leaseTenant) => leaseTenant.tenantId),
    });
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
    const { propertyId, tenantIds, startDate, endDate, rentAmount, chargesAmount, paymentDueDay, irlQuarter, note } = body;

    if (!propertyId || !tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0 || !startDate || rentAmount === undefined || chargesAmount === undefined || !paymentDueDay) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid tenantIds' },
        { status: 400 }
      );
    }

    // Reject a duplicated tenant up front: the repository would fail on the
    // unique constraint after having replaced the join rows (rolled back, so no
    // corruption, but the message would be an opaque Prisma error).
    const duplicatedTenantIds = tenantIds.filter(
      (tenantId, index) => tenantIds.indexOf(tenantId) !== index
    );

    if (duplicatedTenantIds.length > 0) {
      return NextResponse.json(
        { error: `Duplicated tenant id: ${[...new Set(duplicatedTenantIds)].join(', ')}` },
        { status: 400 }
      );
    }

    const repository = new PrismaLeaseRepository(prisma);
    const useCase = new UpdateLease(repository);

    const lease = await useCase.execute({
      id: leaseId,
      propertyId,
      tenantIds,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      rentAmount: Number(rentAmount),
      chargesAmount: Number(chargesAmount),
      paymentDueDay: Number(paymentDueDay),
      irlQuarter: irlQuarter === '' ? null : irlQuarter,
      note: note === '' ? null : note,
    });

    return NextResponse.json({
      id: lease.id,
      propertyId: lease.propertyId,
      tenantIds: lease.tenantIds,
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
