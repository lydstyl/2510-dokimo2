import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaInsuranceCertificateRepository } from '@/features/insurance/infrastructure/PrismaInsuranceCertificateRepository';

// GET /api/properties/[id]/insurance - Get insurance certificates for all leases of a property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: propertyId } = await params;

    // Get all leases for this property
    const leases = await prisma.lease.findMany({
      where: { propertyId },
      select: { id: true },
    });

    const repository = new PrismaInsuranceCertificateRepository(prisma);
    const allCertificates = await Promise.all(
      leases.map((lease) => repository.findByLeaseId(lease.id))
    );
    const certificates = allCertificates.flat();

    return NextResponse.json(
      certificates.map((cert) => ({
        id: cert.id,
        leaseId: cert.leaseId,
        startDate: cert.startDate.toISOString(),
        endDate: cert.endDate?.toISOString(),
        documentPath: cert.documentPath,
        createdAt: cert.createdAt.toISOString(),
        updatedAt: cert.updatedAt.toISOString(),
        isExpired: cert.isExpired(),
        isOlderThanOneYear: cert.isOlderThanOneYear(),
        monthsSinceStart: cert.monthsSinceStart(),
      }))
    );
  } catch (error) {
    console.error('Error fetching insurance certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance certificates' },
      { status: 500 }
    );
  }
}
