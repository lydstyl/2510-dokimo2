import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { CalculateLeaseBalance } from '@/use-cases/CalculateLeaseBalance';

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
    const calculateBalance = new CalculateLeaseBalance(
      rentRevisionRepository,
      leaseRepository,
      paymentRepository
    );

    // Calculate balance for each lease for current month
    const results = [];

    for (const lease of activeLeases) {
      const balance = await calculateBalance.execute(lease.id, now);

      // Only include leases that are not fully paid or overpaid
      const monthlyRent = lease.rentAmount + lease.chargesAmount;
      const paymentsThisMonth = lease.payments.filter(p => {
        const paymentMonth = new Date(p.paymentDate).toISOString().slice(0, 7);
        return paymentMonth === currentMonth;
      });

      const totalPaidThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

      // Calculate balance before this month's payments
      // In CalculateLeaseBalance: balance = totalPaid - totalExpected
      // So: balance > 0 means overpaid, balance < 0 means underpaid
      const balanceBefore = balance.balance - totalPaidThisMonth;
      const balanceAfter = balance.balance;

      // Determine receipt type
      let receiptType: 'unpaid' | 'partial' | 'full' | 'overpayment';
      if (balanceAfter < 0) {
        // Underpaid
        receiptType = 'unpaid';
      } else if (balanceAfter === 0 && totalPaidThisMonth === monthlyRent) {
        receiptType = 'full';
      } else if (balanceAfter === 0 && totalPaidThisMonth < monthlyRent) {
        receiptType = 'partial';
      } else if (balanceAfter > 0) {
        // Overpaid
        receiptType = 'overpayment';
      } else {
        receiptType = 'partial';
      }

      // Only include if unpaid or overpaid (balance != 0)
      if (balanceAfter !== 0) {
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
          rentDue: monthlyRent,
          amountPaid: totalPaidThisMonth,
          balanceBefore,
          balanceAfter,
          receiptType,
          payments: paymentsThisMonth.map(p => ({
            id: p.id,
            amount: p.amount,
            paymentDate: p.paymentDate,
            notes: p.notes,
          })),
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
