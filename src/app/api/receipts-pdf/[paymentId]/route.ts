import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PdfReceiptGenerator } from '@/features/receipt/infrastructure/PdfReceiptGenerator';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
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
            tenants: {
                  include: {
                    tenant: true,
                  },
                },
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
    const chargeRepo = new PrismaChargeRepository(prisma);

    const getApplicableRent = new GetApplicableRentForDate(rentRevisionRepo, leaseRepo);
    const applicableRent = await getApplicableRent.execute(
      payment.leaseId,
      new Date(payment.paymentDate)
    );

    // Calculate balances for the MONTH (same logic as HTML table)
    // The table shows balance at start and end of month, not around individual payment
    const paymentDate = new Date(payment.paymentDate);

    const calculateBalance = new CalculateLeaseBalance(
      rentRevisionRepo,
      leaseRepo,
      paymentRepo,
      chargeRepo
    );

    // Balance before = balance at end of previous month
    const endOfPreviousMonth = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      0,
      23, 59, 59, 999
    );

    const previousMonthResult = await calculateBalance.execute(
      payment.leaseId,
      endOfPreviousMonth
    );

    const balanceBefore = previousMonthResult.balance;

    // Balance after = balance at end of current month
    const endOfCurrentMonth = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth() + 1,
      0,
      23, 59, 59, 999
    );

    const currentMonthResult = await calculateBalance.execute(
      payment.leaseId,
      endOfCurrentMonth
    );

    const balanceAfter = currentMonthResult.balance;

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
        managerName: payment.lease.property.landlord.managerName || undefined,
      },
      tenants: payment.lease.tenants.map(lt => ({
        firstName: lt.tenant.firstName,
        lastName: lt.tenant.lastName,
        email: lt.tenant.email || undefined,
        phone: lt.tenant.phone || undefined,
      })),
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

    // Generate filename based on receipt type and date
    // Format: AAAA_MM_<type>_<nom_locataire>.pdf
    const year = paymentDate.getFullYear();
    const month = String(paymentDate.getMonth() + 1).padStart(2, '0');

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

    // Get tenant name - use firstName + lastName for natural persons, or just firstName for legal entities
    const firstTenant = payment.lease.tenants[0]?.tenant;
    let tenantName = 'LOCATAIRE';

    if (firstTenant) {
      // For legal entities: company name is stored in firstName (lastName is empty)
      // For natural persons: use full name
      if (firstTenant.type === 'LEGAL_ENTITY') {
        tenantName = firstTenant.firstName; // Company name is in firstName for legal entities
      } else {
        tenantName = `${firstTenant.firstName}_${firstTenant.lastName}`;
      }
    }

    const sanitizedTenantName = tenantName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9_]/g, '_')   // Replace special chars with underscore
      .replace(/_+/g, '_')              // Replace multiple underscores with single
      .toUpperCase();

    const filename = `${year}_${month}_${filenamePart}_${sanitizedTenantName}.pdf`;

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
