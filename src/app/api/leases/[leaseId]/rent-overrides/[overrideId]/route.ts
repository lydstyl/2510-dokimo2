import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { DeleteRentOverride } from '@/features/rent-override/application/DeleteRentOverride';

/**
 * DELETE /api/leases/[leaseId]/rent-overrides/[overrideId]
 * Delete a rent override
 *
 * This removes the override, causing the month to fall back to using
 * the applicable RentRevision or base lease amounts.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string; overrideId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { overrideId } = await params;
    const repository = new PrismaLeaseRentOverrideRepository(prisma);
    const useCase = new DeleteRentOverride(repository);

    await useCase.execute(overrideId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting rent override:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
