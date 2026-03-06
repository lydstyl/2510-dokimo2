import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CalculateMonthlyPaymentHistory } from '@/features/lease-payment-history/application/CalculateMonthlyPaymentHistory';
import { GenerateReceiptContent } from '@/features/receipt/application/GenerateReceiptContent';
import { ConvertReceiptToPdf } from '@/features/receipt/application/ConvertReceiptToPdf';

/**
 * GET /api/leases/[leaseId]/receipts-pdf?month=YYYY-MM
 * Generate PDF receipt for a specific lease and month
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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format (REQUIRED)
    const { leaseId } = await params;

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Expected: YYYY-MM' },
        { status: 400 }
      );
    }

    // Fetch lease with all related data
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
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
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Verify the user has access to this lease (through landlord)
    if (lease.property.landlord.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Initialize repositories
    const rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    const leaseRepo = new PrismaLeaseRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);
    const chargeRepo = new PrismaChargeRepository(prisma);
    const rentOverrideRepo = new PrismaLeaseRentOverrideRepository(prisma);

    // Get monthly payment data using centralized calculation
    // IMPORTANT: Use executeForSingleMonth to calculate from lease start
    // This ensures balanceBefore includes all previous months' balances
    const calculateMonthlyHistory = new CalculateMonthlyPaymentHistory(
      leaseRepo,
      paymentRepo,
      chargeRepo,
      rentRevisionRepo,
      rentOverrideRepo
    );

    const monthData = await calculateMonthlyHistory.executeForSingleMonth(
      leaseId,
      month
    );

    // Generate structured receipt content using the SAME use case as TXT
    const contentGenerator = new GenerateReceiptContent();
    const structuredContent = contentGenerator.execute(monthData, {
      tenants: lease.tenants.map(lt => ({
        firstName: lt.tenant.firstName,
        lastName: lt.tenant.lastName,
        email: lt.tenant.email,
        phone: lt.tenant.phone,
      })),
      property: {
        name: lease.property.name,
        address: lease.property.address,
        postalCode: lease.property.postalCode,
        city: lease.property.city,
        landlord: {
          type: lease.property.landlord.type,
          name: lease.property.landlord.name,
          managerName: lease.property.landlord.managerName,
        },
      },
    });

    // Convert structured content to PDF
    const pdfConverter = new ConvertReceiptToPdf();
    const pdfBuffer = pdfConverter.execute(structuredContent);

    // Generate filename
    const [year, monthNumber] = month.split('-');
    let filenamePart = '';
    switch (structuredContent.receiptType) {
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

    const firstTenant = lease.tenants[0]?.tenant;
    let tenantName = 'LOCATAIRE';

    if (firstTenant) {
      if (firstTenant.type === 'LEGAL_ENTITY') {
        tenantName = firstTenant.firstName;
      } else {
        tenantName = `${firstTenant.firstName}_${firstTenant.lastName}`;
      }
    }

    const sanitizedTenantName = tenantName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .toUpperCase();

    const filename = `${year}_${monthNumber}_${filenamePart}_${sanitizedTenantName}.pdf`;

    // Return PDF file
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
