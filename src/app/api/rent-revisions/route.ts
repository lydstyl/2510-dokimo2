import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/features/rent-revision/infrastructure/PrismaRentRevisionRepository';
import { CreateRentRevision } from '@/features/rent-revision/application/CreateRentRevision';
import { RentRevisionStatus } from '@/features/rent-revision/domain/RentRevision';

/**
 * GET /api/rent-revisions
 * Get all rent revisions, optionally filtered by status or lease
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RentRevisionStatus | null;
    const leaseId = searchParams.get('leaseId');

    const repository = new PrismaRentRevisionRepository(prisma);

    let revisions;
    if (leaseId) {
      revisions = await repository.findByLeaseId(leaseId);
    } else if (status) {
      revisions = await repository.findByStatus(status);
    } else {
      revisions = await repository.findAll();
    }

    // Include lease details for display
    const revisionsWithLeases = await Promise.all(
      revisions.map(async (revision) => {
        const lease = await prisma.lease.findUnique({
          where: { id: revision.leaseId },
          include: {
            property: {
              include: {
                landlord: true,
              },
            },
            tenants: {
              include: {
                tenant: true,
              },
            },
          },
        });

        return {
          id: revision.id,
          leaseId: revision.leaseId,
          effectiveDate: revision.effectiveDate.toISOString(),
          rentAmount: revision.rentAmount.getValue(),
          chargesAmount: revision.chargesAmount.getValue(),
          totalAmount: revision.totalAmount().getValue(),
          reason: revision.reason,
          status: revision.status,
          isUrgent: revision.isUrgent(),
          createdAt: revision.createdAt.toISOString(),
          updatedAt: revision.updatedAt.toISOString(),
          lease: lease
            ? {
                id: lease.id,
                property: {
                  name: lease.property.name,
                  address: lease.property.address,
                },
                tenant: lease.tenants[0]
                  ? {
                      firstName: lease.tenants[0].tenant.firstName,
                      lastName: lease.tenants[0].tenant.lastName,
                    }
                  : null,
              }
            : null,
        };
      })
    );

    // Group by status and urgency
    const urgent = revisionsWithLeases.filter((r) => r.isUrgent && r.status === 'EN_PREPARATION');
    const enPreparation = revisionsWithLeases.filter((r) => r.status === 'EN_PREPARATION' && !r.isUrgent);
    const courrierEnvoye = revisionsWithLeases.filter((r) => r.status === 'COURRIER_AR_ENVOYE');

    return NextResponse.json({
      urgent,
      enPreparation,
      courrierEnvoye,
      all: revisionsWithLeases,
    });
  } catch (error) {
    console.error('Error getting rent revisions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rent-revisions
 * Create a new rent revision
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leaseId, effectiveDate, rentAmount, chargesAmount, reason } = body;

    if (!leaseId || !effectiveDate || rentAmount === undefined || chargesAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const repository = new PrismaRentRevisionRepository(prisma);
    const useCase = new CreateRentRevision(repository);

    const revision = await useCase.execute({
      leaseId,
      effectiveDate: new Date(effectiveDate),
      rentAmount: parseFloat(rentAmount),
      chargesAmount: parseFloat(chargesAmount),
      reason,
    });

    return NextResponse.json({
      id: revision.id,
      leaseId: revision.leaseId,
      effectiveDate: revision.effectiveDate.toISOString(),
      rentAmount: revision.rentAmount.getValue(),
      chargesAmount: revision.chargesAmount.getValue(),
      totalAmount: revision.totalAmount().getValue(),
      reason: revision.reason,
      status: revision.status,
      createdAt: revision.createdAt.toISOString(),
      updatedAt: revision.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating rent revision:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
