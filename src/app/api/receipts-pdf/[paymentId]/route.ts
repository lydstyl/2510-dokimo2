import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PdfReceiptGenerator } from '@/features/receipt/infrastructure/PdfReceiptGenerator';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { GetApplicableRentForDate } from '@/use-cases/GetApplicableRentForDate';
import { CalculateLeaseBalance } from '@/use-cases/CalculateLeaseBalance';

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
    const receiptType = (searchParams.get('type') || 'full') as 'full' | 'partial' | 'overpayment' | 'unpaid';
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
    const paymentRepo = new PrismaPaymentRepository(prisma);

    const getApplicableRent = new GetApplicableRentForDate(rentRevisionRepo, leaseRepo);
    const applicableRent = await getApplicableRent.execute(
      payment.leaseId,
      new Date(payment.paymentDate)
    );

    // Calculate balances correctly taking into account all rent revisions
    const calculateBalance = new CalculateLeaseBalance(
      rentRevisionRepo,
      leaseRepo,
      paymentRepo
    );

    const balances = await calculateBalance.executeForPayment(
      payment.leaseId,
      payment.id
    );

    const balanceBefore = balances.balanceBefore;
    const balanceAfter = balances.balanceAfter;

    // Generate receipt number
    const receiptNumber = `REC-${payment.id.slice(0, 8).toUpperCase()}`;

    // Prepare data for PDF generation with applicable rent amounts
    const receiptData = {
      receiptNumber,
      issueDate: new Date(),
      paymentDate: payment.paymentDate,
      receiptType,
      landlord: {
        name: payment.lease.property.landlord.name,
        type: payment.lease.property.landlord.type as 'NATURAL_PERSON' | 'LEGAL_ENTITY',
        address: payment.lease.property.landlord.address,
        email: payment.lease.property.landlord.email || undefined,
        phone: payment.lease.property.landlord.phone || undefined,
        siret: payment.lease.property.landlord.siret || undefined,
      },
      tenant: {
        firstName: payment.lease.tenant.firstName,
        lastName: payment.lease.tenant.lastName,
        email: payment.lease.tenant.email || undefined,
        phone: payment.lease.tenant.phone || undefined,
      },
      property: {
        name: payment.lease.property.name,
        address: payment.lease.property.address,
        city: payment.lease.property.city,
        postalCode: payment.lease.property.postalCode,
      },
      lease: {
        rentAmount: applicableRent.rentAmount,
        chargesAmount: applicableRent.chargesAmount,
        paymentDueDay: payment.lease.paymentDueDay,
      },
      payment: {
        amount: payment.amount,
        notes: payment.notes || undefined,
      },
      balance: {
        before: balanceBefore,
        after: balanceAfter,
      },
    };

    // Generate PDF
    const pdfGenerator = new PdfReceiptGenerator();
    const pdfBuffer = pdfGenerator.generate(receiptData);

    // Generate filename based on receipt type
    let filenamePart = '';
    switch (receiptType) {
      case 'full':
        filenamePart = 'quittance';
        break;
      case 'partial':
        filenamePart = 'recu-partiel';
        break;
      case 'overpayment':
        filenamePart = 'trop-percu';
        break;
      case 'unpaid':
        filenamePart = 'impaye';
        break;
    }

    const filename = `${filenamePart}-${receiptNumber}.pdf`;

    // Return as PDF file (convert Uint8Array to Buffer for NextResponse)
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
