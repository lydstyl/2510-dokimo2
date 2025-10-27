import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { CreateRentRevision } from '@/use-cases/CreateRentRevision';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leaseId, effectiveDate, rentAmount, chargesAmount, reason } = body;

    // Validate required fields
    if (!leaseId || !effectiveDate || rentAmount === undefined || chargesAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: leaseId, effectiveDate, rentAmount, chargesAmount' },
        { status: 400 }
      );
    }

    // Verify user has access to this lease
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    if (lease.property.landlord.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create rent revision
    const rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    const leaseRepo = new PrismaLeaseRepository(prisma);
    const useCase = new CreateRentRevision(rentRevisionRepo, leaseRepo);

    const revision = await useCase.execute({
      leaseId,
      effectiveDate: new Date(effectiveDate),
      rentAmount: Number(rentAmount),
      chargesAmount: Number(chargesAmount),
      reason,
    });

    // Return serialized response
    return NextResponse.json({
      id: revision.id,
      leaseId: revision.leaseId,
      effectiveDate: revision.effectiveDate.toISOString(),
      rentAmount: revision.rentAmount.getValue(),
      chargesAmount: revision.chargesAmount.getValue(),
      totalAmount: revision.totalAmount.getValue(),
      reason: revision.reason,
      createdAt: revision.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating rent revision:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
