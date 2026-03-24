import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CalculateMonthlyPaymentHistory } from '@/features/lease-payment-history/application/CalculateMonthlyPaymentHistory';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month (YYYY-MM format)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch all active leases
    const activeLeases = await prisma.lease.findMany({
      where: {
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: {
        tenants: {
                  include: {
                    tenant: true,
                  },
                },
        property: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    const rentRevisionRepository = new PrismaRentRevisionRepository(prisma);
    const leaseRepository = new PrismaLeaseRepository(prisma);
    const paymentRepository = new PrismaPaymentRepository(prisma);
    const chargeRepository = new PrismaChargeRepository(prisma);
    const rentOverrideRepository = new PrismaLeaseRentOverrideRepository(prisma);

    const calculateMonthlyHistory = new CalculateMonthlyPaymentHistory(
      leaseRepository,
      paymentRepository,
      chargeRepository,
      rentRevisionRepository,
      rentOverrideRepository
    );

    // Calculate balance for each lease for current month
    const results = [];

    for (const lease of activeLeases) {
      // Use CalculateMonthlyPaymentHistory which is the single source of truth
      // and correctly handles rent revisions, overrides, and charges
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        lease.id,
        currentMonth
      );

      // Get the last payment (even if before current month)
      const lastPayment = lease.payments.length > 0 ? lease.payments[0] : null;

      // Only include if tenant has an outstanding balance (exclude fully-paid)
      if (monthData.balanceAfter !== 0) {
        results.push({
          leaseId: lease.id,
          property: {
            id: lease.property.id,
            name: lease.property.name,
          },
          tenant: {
            id: lease.tenants[0].tenant.id,
            firstName: lease.tenants[0].tenant.firstName,
            lastName: lease.tenants[0].tenant.lastName,
          },
          month: currentMonth,
          rentDue: monthData.monthlyRent,
          amountPaid: monthData.totalPaid,
          balanceBefore: monthData.balanceBefore,
          balanceAfter: monthData.balanceAfter,
          receiptType: monthData.receiptType,
          payments: monthData.payments.map(p => ({
            id: p.id,
            amount: p.amount,
            paymentDate: p.paymentDate,
            notes: p.notes || null,
          })),
          lastPayment: lastPayment ? {
            amount: lastPayment.amount,
            paymentDate: lastPayment.paymentDate,
          } : null,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching quick rent overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
