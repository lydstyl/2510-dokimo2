import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { GetApplicableRentForDate } from '@/use-cases/GetApplicableRentForDate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const receiptType = searchParams.get('type') || 'full';
    const { paymentId } = await params;

    // Fetch the payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            tenant: true,
            property: {
              include: {
                landlord: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify the user has access to this payment (through landlord)
    if (payment.lease.property.landlord.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get applicable rent for the payment date (considering rent revisions)
    const rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    const leaseRepo = new PrismaLeaseRepository(prisma);
    const getApplicableRent = new GetApplicableRentForDate(rentRevisionRepo, leaseRepo);

    const applicableRent = await getApplicableRent.execute(
      payment.leaseId,
      new Date(payment.paymentDate)
    );

    // Calculate balances
    const monthlyRent = applicableRent.totalAmount;
    const startDate = new Date(payment.lease.startDate);
    const paymentDate = new Date(payment.paymentDate);

    const monthsSinceStart = Math.floor(
      (paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ) + 1;

    // Get all payments up to this one to calculate running balance
    const previousPayments = await prisma.payment.findMany({
      where: {
        leaseId: payment.leaseId,
        paymentDate: { lte: payment.paymentDate },
      },
      orderBy: { paymentDate: 'asc' },
    });

    const totalPaidBefore = previousPayments
      .filter(p => p.id !== payment.id)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPaidAfter = totalPaidBefore + payment.amount;
    const expectedTotal = monthlyRent * monthsSinceStart;
    const balanceBefore = totalPaidBefore - expectedTotal;
    const balanceAfter = totalPaidAfter - expectedTotal;

    // Generate receipt content with applicable rent amounts
    const receiptContent = generateReceiptText(
      payment,
      receiptType,
      applicableRent.rentAmount,
      applicableRent.chargesAmount,
      monthlyRent,
      balanceBefore,
      balanceAfter
    );

    // Return as text file
    return new NextResponse(receiptContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateReceiptText(
  payment: any,
  receiptType: string,
  rentAmount: number,
  chargesAmount: number,
  monthlyRent: number,
  balanceBefore: number,
  balanceAfter: number
): string {
  const landlord = payment.lease.property.landlord;
  const tenant = payment.lease.tenant;
  const property = payment.lease.property;

  const lines: string[] = [];

  lines.push('='.repeat(60));

  if (receiptType === 'full') {
    lines.push('                      RENT RECEIPT');
  } else if (receiptType === 'partial') {
    lines.push('                 PARTIAL RENT RECEIPT');
  } else {
    lines.push('              RENT OVERPAYMENT RECEIPT');
  }

  lines.push('='.repeat(60));
  lines.push('');

  lines.push(`Receipt Date: ${new Date().toLocaleDateString()}`);
  lines.push(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`);
  lines.push('');

  lines.push('LANDLORD INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Name: ${landlord.name}`);
  lines.push(`Type: ${landlord.type === 'NATURAL_PERSON' ? 'Natural Person' : 'Legal Entity'}`);
  lines.push(`Address: ${landlord.address}`);
  if (landlord.email) lines.push(`Email: ${landlord.email}`);
  if (landlord.phone) lines.push(`Phone: ${landlord.phone}`);
  if (landlord.siret) lines.push(`SIRET: ${landlord.siret}`);
  lines.push('');

  lines.push('TENANT INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Name: ${tenant.firstName} ${tenant.lastName}`);
  if (tenant.email) lines.push(`Email: ${tenant.email}`);
  if (tenant.phone) lines.push(`Phone: ${tenant.phone}`);
  lines.push('');

  lines.push('PROPERTY INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Property: ${property.name}`);
  lines.push(`Address: ${property.address}`);
  lines.push(`${property.postalCode} ${property.city}`);
  lines.push('');

  lines.push('LEASE INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Monthly Rent: €${rentAmount.toFixed(2)}`);
  lines.push(`Monthly Charges: €${chargesAmount.toFixed(2)}`);
  lines.push(`Total Monthly Payment: €${monthlyRent.toFixed(2)}`);
  lines.push(`Payment Due Day: ${payment.lease.paymentDueDay}`);
  lines.push('');

  lines.push('PAYMENT DETAILS');
  lines.push('-'.repeat(60));
  lines.push(`Amount Paid: €${payment.amount.toFixed(2)}`);
  if (payment.notes) {
    lines.push(`Notes: ${payment.notes}`);
  }
  lines.push('');

  lines.push('BALANCE INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Balance Before Payment: ${balanceBefore < 0 ? '-' : '+'}€${Math.abs(balanceBefore).toFixed(2)}`);
  lines.push(`Balance After Payment: ${balanceAfter < 0 ? '-' : '+'}€${Math.abs(balanceAfter).toFixed(2)}`);
  lines.push('');

  if (receiptType === 'full') {
    lines.push('STATUS: RENT PAID IN FULL');
    lines.push('The tenant is up to date with rent payments.');
  } else if (receiptType === 'partial') {
    lines.push('STATUS: PARTIAL PAYMENT');
    lines.push(`Remaining balance owed: €${Math.abs(balanceAfter).toFixed(2)}`);
  } else {
    lines.push('STATUS: OVERPAYMENT');
    lines.push(`Credit balance: €${balanceAfter.toFixed(2)}`);
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('This receipt is generated electronically and is valid without signature.');
  lines.push(`Generated on: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}
