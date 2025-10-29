import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaInsuranceCertificateRepository } from '@/features/insurance/infrastructure/PrismaInsuranceCertificateRepository';

// GET /api/properties/[id]/insurance - Get insurance certificates for a property
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

    const repository = new PrismaInsuranceCertificateRepository(prisma);
    const certificates = await repository.findByPropertyId(propertyId);

    return NextResponse.json(
      certificates.map((cert) => ({
        id: cert.id,
        propertyId: cert.propertyId,
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
