import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { CreateLease } from '@/use-cases/CreateLease';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const tenantId = searchParams.get('tenantId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const repository = new PrismaLeaseRepository(prisma);

    // Always return leases with relations for the UI
    let whereCondition: any = {};

    if (propertyId) {
      whereCondition.propertyId = propertyId;
    } else if (tenantId) {
      whereCondition.tenantId = tenantId;
    } else if (activeOnly) {
      const now = new Date();
      whereCondition = {
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      };
    }

    const leasesWithRelations = await prisma.lease.findMany({
      where: whereCondition,
      include: {
        tenant: true,
        property: {
          include: {
            landlord: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(leasesWithRelations);
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, tenantId, startDate, endDate, rentAmount, chargesAmount, paymentDueDay } = body;

    if (!propertyId || !tenantId || !startDate || rentAmount === undefined || chargesAmount === undefined || !paymentDueDay) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const repository = new PrismaLeaseRepository(prisma);
    const useCase = new CreateLease(repository);

    const lease = await useCase.execute({
      propertyId,
      tenantId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      rentAmount: Number(rentAmount),
      chargesAmount: Number(chargesAmount),
      paymentDueDay: Number(paymentDueDay),
    });

    return NextResponse.json(
      {
        id: lease.id,
        propertyId: lease.propertyId,
        tenantId: lease.tenantId,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount.getValue(),
        chargesAmount: lease.chargesAmount.getValue(),
        totalAmount: lease.totalAmount.getValue(),
        paymentDueDay: lease.paymentDueDay,
        createdAt: lease.createdAt,
        updatedAt: lease.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lease:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
