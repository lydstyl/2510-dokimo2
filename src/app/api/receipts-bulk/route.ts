import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PdfReceiptGenerator } from '@/features/receipt/infrastructure/PdfReceiptGenerator';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { GetApplicableRentForDate } from '@/use-cases/GetApplicableRentForDate';
import { CalculateLeaseBalance } from '@/use-cases/CalculateLeaseBalance';
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
    const getApplicableRent = new GetApplicableRentForDate(rentRevisionRepo, leaseRepo);
    const calculateBalance = new CalculateLeaseBalance(
      rentRevisionRepo,
      leaseRepo,
      paymentRepo
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

    // Filter out leases with no payments and no balance (nothing to generate)
    const leasesToProcess = [];
    for (const lease of leases) {
      const balances = await calculateBalance.execute(lease.id, endDate);

      // Only include leases that have payments OR a non-zero balance
      if (lease.payments.length > 0 || balances.balance !== 0) {
        leasesToProcess.push({
          lease,
          balances,
        });
      }
    }

    if (leasesToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No receipts to generate for this month' },
        { status: 404 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const pdfGenerator = new PdfReceiptGenerator();

    // Generate PDFs for each lease
    for (const { lease, balances } of leasesToProcess) {
      // Get applicable rent for the month
      const applicableRent = await getApplicableRent.execute(
        lease.id,
        endDate
      );
      const totalRent = applicableRent.rentAmount + applicableRent.chargesAmount;

      // Calculate payment information for this month
      let paymentAmount = 0;
      let paymentDate = endDate;
      let paymentNotes: string | undefined;
      let paymentId = '';

      if (lease.payments.length > 0) {
        // Use the last payment of the month
        const lastPayment = lease.payments[lease.payments.length - 1];
        paymentAmount = lease.payments.reduce((sum, p) => sum + p.amount, 0);
        paymentDate = new Date(lastPayment.paymentDate);
        paymentNotes = lastPayment.notes || undefined;
        paymentId = lastPayment.id;
      } else {
        paymentId = `unpaid-${lease.id}-${year}-${month}`;
      }

      // Calculate balance before this month's payments
      // In CalculateLeaseBalance: balance = totalPaid - totalExpected
      // So: balance > 0 means overpaid, balance < 0 means underpaid
      const balanceBefore = balances.balance - paymentAmount;
      const balanceAfter = balances.balance;

      // Determine receipt type using the same logic as quick-rent-overview
      let receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
      if (paymentAmount === 0) {
        // No payment this month
        receiptType = 'unpaid';
      } else if (balanceAfter === 0 && paymentAmount === totalRent) {
        // Paid exactly the rent amount and balance is zero
        receiptType = 'full';
      } else if (balanceAfter === 0 && paymentAmount < totalRent) {
        // Balance is zero but paid less than rent (used previous credit)
        receiptType = 'partial';
      } else if (balanceAfter > 0) {
        // Overpaid (balance is positive)
        receiptType = 'overpayment';
      } else if (balanceAfter < 0 && paymentAmount > 0) {
        // Paid something but still underpaid
        receiptType = 'partial';
      } else {
        // Default case: underpaid with no payment
        receiptType = 'unpaid';
      }

      // Skip unpaid notices as per user's request (only quittances, trop-perçu, reçu partiel)
      if (receiptType === 'unpaid') {
        continue;
      }

      // Generate receipt number
      const receiptNumber = `REC-${paymentId.slice(0, 8).toUpperCase()}`;

      // Prepare receipt data
      const receiptData = {
        receiptNumber,
        issueDate: new Date(),
        paymentDate,
        receiptType,
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
          rentAmount: applicableRent.rentAmount,
          chargesAmount: applicableRent.chargesAmount,
          paymentDueDay: lease.paymentDueDay,
        },
        payment: {
          amount: paymentAmount,
          notes: paymentNotes,
        },
        balance: {
          before: balanceBefore,
          after: balanceAfter,
        },
      };

      // Generate PDF
      const pdfBuffer = pdfGenerator.generate(receiptData);

      // Generate filename: AAAA_MM_<type>_<tenant_lastname>.pdf
      let filenamePart = '';
      switch (receiptType) {
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

      // Get first tenant's last name (sanitize for filename)
      const firstTenantLastName = lease.tenants[0]?.tenant.lastName || 'locataire';
      const sanitizedLastName = firstTenantLastName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9]/g, '_')   // Replace special chars with underscore
        .toUpperCase();

      const filename = `${year}_${String(monthNum).padStart(2, '0')}_${filenamePart}_${sanitizedLastName}.pdf`;

      // Add to ZIP
      zip.file(filename, pdfBuffer);
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
