import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/insurance/overview - Get all insurance certificates with property info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const certificates = await prisma.insuranceCertificate.findMany({
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const now = new Date();
    const certificatesWithStatus = certificates.map((cert) => {
      const endDate = cert.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year if null
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isExpired = endDate < now;
      const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

      return {
        id: cert.id,
        propertyId: cert.propertyId,
        propertyName: cert.property.name,
        propertyAddress: `${cert.property.address}, ${cert.property.postalCode} ${cert.property.city}`,
        landlordName: cert.property.landlord.name,
        issueDate: cert.startDate.toISOString(),
        expiryDate: endDate.toISOString(),
        pdfPath: cert.documentPath,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
        createdAt: cert.createdAt.toISOString(),
        updatedAt: cert.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(certificatesWithStatus);
  } catch (error) {
    console.error('Error fetching insurance overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance certificates' },
      { status: 500 }
    );
  }
}
