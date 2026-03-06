import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PdfReceiptGenerator } from '@/features/receipt/infrastructure/PdfReceiptGenerator';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CalculateMonthlyPaymentHistory } from '@/features/lease-payment-history/application/CalculateMonthlyPaymentHistory';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month' },
        { status: 400 }
      );
    }

    // Create date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Initialize repositories and use cases
    const rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    const leaseRepo = new PrismaLeaseRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);
    const chargeRepo = new PrismaChargeRepository(prisma);
    const rentOverrideRepo = new PrismaLeaseRentOverrideRepository(prisma);
    const calculateMonthlyHistory = new CalculateMonthlyPaymentHistory(
      leaseRepo,
      paymentRepo,
      chargeRepo,
      rentRevisionRepo,
      rentOverrideRepo
    );

    // Fetch all active leases for the user
    const leases = await prisma.lease.findMany({
      where: {
        property: {
          landlord: {
            userId: session.userId,
          },
        },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
      },
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
        payments: {
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            paymentDate: 'asc',
          },
        },
      },
    });

    // Target month for PDF generation
    const targetMonth = `${year}-${String(monthNum).padStart(2, '0')}`;

    // Create ZIP file
    const zip = new JSZip();
    const pdfGenerator = new PdfReceiptGenerator();

    // Generate PDFs for each lease using the centralized monthly payment history
    for (const lease of leases) {
      // Get monthly payment data for this lease and month
      const monthlyHistory = await calculateMonthlyHistory.execute(
        lease.id,
        targetMonth,
        targetMonth
      );

      if (monthlyHistory.length === 0) {
        continue; // Skip leases with no data
      }

      const monthData = monthlyHistory[0];

      // Skip unpaid notices as per user's request (only quittances, trop-perçu, reçu partiel)
      if (monthData.receiptType === 'unpaid') {
        continue;
      }

      // Skip months with no payments and zero balance (nothing to generate)
      if (monthData.totalPaid === 0 && monthData.balanceAfter === 0) {
        continue;
      }

      // Determine payment information
      let paymentDate = endDate;
      let paymentNotes: string | undefined;
      let paymentId = '';

      if (monthData.payments.length > 0) {
        // Use the last payment of the month
        const lastPayment = monthData.payments[monthData.payments.length - 1];
        paymentDate = new Date(lastPayment.paymentDate);
        paymentNotes = lastPayment.notes || undefined;
        paymentId = lastPayment.id;
      } else {
        // No direct payment but may have used credit
        paymentId = `credit-${lease.id}-${year}-${monthNum}`;
      }

      // Generate receipt number
      const receiptNumber = `REC-${paymentId.slice(0, 8).toUpperCase()}`;

      // Calculate period label (e.g., "Janvier 2026")
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const periodLabel = `${monthNames[monthNum - 1]} ${yearNum}`;

      // Prepare receipt data using centralized monthly data
      const receiptData = {
        receiptNumber,
        issueDate: new Date(),
        paymentDate,
        period: periodLabel,
        receiptType: monthData.receiptType,
        landlord: {
          name: lease.property.landlord.name,
          type: lease.property.landlord.type as 'NATURAL_PERSON' | 'LEGAL_ENTITY',
          address: lease.property.landlord.address,
          email: lease.property.landlord.email || undefined,
          phone: lease.property.landlord.phone || undefined,
          siret: lease.property.landlord.siret || undefined,
          managerName: lease.property.landlord.managerName || undefined,
        },
        tenants: lease.tenants.map(lt => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email || undefined,
          phone: lt.tenant.phone || undefined,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          city: lease.property.city,
          postalCode: lease.property.postalCode,
        },
        lease: {
          rentAmount: monthData.rentAmount,
          chargesAmount: monthData.chargesAmount,
          paymentDueDay: lease.paymentDueDay,
        },
        payment: {
          amount: monthData.totalPaid,
          notes: paymentNotes,
        },
        payments: monthData.payments,
        balance: {
          before: monthData.balanceBefore,
          after: monthData.balanceAfter,
        },
      };

      // Generate PDF
      const pdfBuffer = pdfGenerator.generate(receiptData);

      // Generate filename: AAAA_MM_<type>_<tenant_lastname>.pdf
      let filenamePart = '';
      switch (monthData.receiptType) {
        case 'full':
          filenamePart = 'quittance';
          break;
        case 'partial':
          filenamePart = 'recu_partiel';
          break;
        case 'overpayment':
          filenamePart = 'trop_percu';
          break;
      }

      // Get tenant name - use firstName + lastName for natural persons, or just firstName for legal entities
      const firstTenant = lease.tenants[0]?.tenant;
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

      const filename = `${year}_${String(monthNum).padStart(2, '0')}_${filenamePart}_${sanitizedTenantName}.pdf`;

      // Organize by landlord folder
      const landlordName = lease.property.landlord.name;
      const sanitizedLandlordName = landlordName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9_]/g, '_')   // Replace special chars with underscore
        .replace(/_+/g, '_')              // Replace multiple underscores with single
        .toUpperCase();

      const filePath = `${sanitizedLandlordName}/${filename}`;

      // Add to ZIP
      zip.file(filePath, pdfBuffer);
    }

    // Check if we have any files in the ZIP
    const files = Object.keys(zip.files);
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No receipts to generate (only unpaid notices available)' },
        { status: 404 }
      );
    }

    // Generate ZIP file
    const zipData = await zip.generateAsync({ type: 'uint8array' });

    // Generate ZIP filename: AAAA-MM-dokimo.zip
    const zipFilename = `${year}-${String(monthNum).padStart(2, '0')}-dokimo.zip`;

    // Return ZIP file (convert Uint8Array to Buffer for NextResponse)
    return new NextResponse(Buffer.from(zipData), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating bulk receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
