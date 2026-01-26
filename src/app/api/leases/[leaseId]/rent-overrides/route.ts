import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CreateOrUpdateRentOverride } from '@/features/rent-override/application/CreateOrUpdateRentOverride';

/**
 * POST /api/leases/[leaseId]/rent-overrides
 * Create or update a rent override for a specific month
 *
 * This allows modifying the rent displayed in payment history for a specific month
 * WITHOUT creating a formal RentRevision. If an override already exists for the
 * lease/month combination, it updates it.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leaseId } = await params;
    const body = await request.json();
    const { month, rentAmount, chargesAmount, reason } = body;

    if (!month || rentAmount === undefined || chargesAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: month, rentAmount, chargesAmount' },
        { status: 400 }
      );
    }

    const repository = new PrismaLeaseRentOverrideRepository(prisma);
    const useCase = new CreateOrUpdateRentOverride(repository);

    const override = await useCase.execute({
      leaseId,
      month,
      rentAmount: parseFloat(rentAmount),
      chargesAmount: parseFloat(chargesAmount),
      reason,
    });

    return NextResponse.json({
      id: override.id,
      leaseId: override.leaseId,
      month: override.month,
      rentAmount: override.rentAmount.getValue(),
      chargesAmount: override.chargesAmount.getValue(),
      totalAmount: override.totalAmount().getValue(),
      reason: override.reason,
      createdAt: override.createdAt.toISOString(),
      updatedAt: override.updatedAt.toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating/updating rent override:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

/**
 * GET /api/leases/[leaseId]/rent-overrides
 * Get all rent overrides for a lease
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leaseId } = await params;
    const repository = new PrismaLeaseRentOverrideRepository(prisma);
    const overrides = await repository.findAllByLeaseId(leaseId);

    return NextResponse.json(
      overrides.map(override => ({
        id: override.id,
        leaseId: override.leaseId,
        month: override.month,
        rentAmount: override.rentAmount.getValue(),
        chargesAmount: override.chargesAmount.getValue(),
        totalAmount: override.totalAmount().getValue(),
        reason: override.reason,
        createdAt: override.createdAt.toISOString(),
        updatedAt: override.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching rent overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
