import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaPropertyRepository } from '@/infrastructure/repositories/PrismaPropertyRepository';
import { PrismaTenantRepository } from '@/infrastructure/repositories/PrismaTenantRepository';
import { PrismaLandlordRepository } from '@/infrastructure/repositories/PrismaLandlordRepository';
import { GenerateRentReceipt } from '@/use-cases/GenerateRentReceipt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;

    const leaseRepo = new PrismaLeaseRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);
    const propertyRepo = new PrismaPropertyRepository(prisma);
    const tenantRepo = new PrismaTenantRepository(prisma);
    const landlordRepo = new PrismaLandlordRepository(prisma);

    const useCase = new GenerateRentReceipt(
      leaseRepo,
      paymentRepo,
      propertyRepo,
      tenantRepo,
      landlordRepo
    );

    const receiptData = await useCase.execute(paymentId);

    return NextResponse.json(receiptData);
  } catch (error: any) {
    console.error('Error generating rent receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
