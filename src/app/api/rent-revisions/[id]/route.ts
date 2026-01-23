import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/features/rent-revision/infrastructure/PrismaRentRevisionRepository';
import { UpdateRentRevision } from '@/features/rent-revision/application/UpdateRentRevision';
import { DeleteRentRevision } from '@/features/rent-revision/application/DeleteRentRevision';
import { MarkRevisionAsLetterSent } from '@/features/rent-revision/application/MarkRevisionAsLetterSent';
import { RevertRevisionToPreparation } from '@/features/rent-revision/application/RevertRevisionToPreparation';

/**
 * GET /api/rent-revisions/[id]
 * Get a single rent revision with lease details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const repository = new PrismaRentRevisionRepository(prisma);
    const revision = await repository.findById(id);

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Include lease details
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
      lease: lease
        ? {
            id: lease.id,
            rentAmount: lease.rentAmount,
            chargesAmount: lease.chargesAmount,
            property: {
              name: lease.property.name,
              address: lease.property.address,
              postalCode: lease.property.postalCode,
              city: lease.property.city,
              landlord: {
                name: lease.property.landlord.name,
                address: lease.property.landlord.address,
              },
            },
            tenants: lease.tenants.map((lt) => ({
              tenant: {
                civility: lt.tenant.civility,
                firstName: lt.tenant.firstName,
                lastName: lt.tenant.lastName,
              },
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching rent revision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rent-revisions/[id]
 * Update a rent revision or mark letter as sent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { effectiveDate, rentAmount, chargesAmount, reason, markAsLetterSent, revertToPreparation } = body;

    const repository = new PrismaRentRevisionRepository(prisma);

    // If reverting to preparation
    if (revertToPreparation) {
      const useCase = new RevertRevisionToPreparation(repository);
      const revision = await useCase.execute(id);

      return NextResponse.json({
        id: revision.id,
        status: revision.status,
        updatedAt: revision.updatedAt.toISOString(),
      });
    }

    // If marking letter as sent
    if (markAsLetterSent) {
      const useCase = new MarkRevisionAsLetterSent(repository);
      const revision = await useCase.execute(id);

      return NextResponse.json({
        id: revision.id,
        status: revision.status,
        updatedAt: revision.updatedAt.toISOString(),
      });
    }

    // Otherwise, update the revision
    const useCase = new UpdateRentRevision(repository);
    const revision = await useCase.execute({
      id,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      rentAmount: rentAmount !== undefined ? parseFloat(rentAmount) : undefined,
      chargesAmount: chargesAmount !== undefined ? parseFloat(chargesAmount) : undefined,
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
      updatedAt: revision.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating rent revision:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/rent-revisions/[id]
 * Delete a rent revision
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const repository = new PrismaRentRevisionRepository(prisma);
    const useCase = new DeleteRentRevision(repository);

    await useCase.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting rent revision:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
