import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CalculateMonthlyPaymentHistory } from '@/features/lease-payment-history/application/CalculateMonthlyPaymentHistory';

/**
 * API endpoint to get monthly payment history for a lease
 * This is the single source of truth for monthly payment calculations
 */
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
    const { searchParams } = new URL(request.url);
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');

    if (!startMonth || !endMonth) {
      return NextResponse.json(
        { error: 'Missing required parameters: startMonth, endMonth (format: YYYY-MM)' },
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

    // Initialize repositories
    const leaseRepo = new PrismaLeaseRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);
    const chargeRepo = new PrismaChargeRepository(prisma);
    const rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    const rentOverrideRepo = new PrismaLeaseRentOverrideRepository(prisma);

    // Calculate monthly payment history
    const useCase = new CalculateMonthlyPaymentHistory(
      leaseRepo,
      paymentRepo,
      chargeRepo,
      rentRevisionRepo,
      rentOverrideRepo
    );

    const monthlyHistory = await useCase.execute(leaseId, startMonth, endMonth);

    return NextResponse.json(monthlyHistory);
  } catch (error: any) {
    console.error('Error fetching monthly payment history:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
