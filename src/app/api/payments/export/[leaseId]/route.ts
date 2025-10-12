import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { ExportPaymentsToCSV } from '@/use-cases/ExportPaymentsToCSV';

export async function GET(
  request: NextRequest,
  { params }: { params: { leaseId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaseRepo = new PrismaLeaseRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);

    const useCase = new ExportPaymentsToCSV(paymentRepo, leaseRepo);
    const csvContent = await useCase.execute(params.leaseId);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-${params.leaseId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting payments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
