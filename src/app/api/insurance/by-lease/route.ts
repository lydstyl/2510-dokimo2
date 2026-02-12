import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/insurance/by-lease - Get all active leases with their latest insurance certificate
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Fetch all active leases with property, tenants, landlord, and latest insurance certificate
    const leases = await prisma.lease.findMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
        tenants: {
          include: {
            tenant: true,
          },
        },
        insuranceCertificates: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { property: { name: 'asc' } },
      ],
    });

    const result = leases.map((lease) => {
      const latestCert = lease.insuranceCertificates[0] ?? null;
      const primaryTenant = lease.tenants[0]?.tenant ?? null;

      let insuranceStatus: 'valid' | 'expired' | 'none' = 'none';
      let daysUntilExpiry: number | null = null;

      if (latestCert) {
        const endDate = latestCert.endDate;
        if (endDate) {
          daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          insuranceStatus = endDate < now ? 'expired' : 'valid';
        } else {
          insuranceStatus = 'valid'; // No expiry date = assumed valid
        }
      }

      return {
        lease: {
          id: lease.id,
          startDate: lease.startDate.toISOString(),
          endDate: lease.endDate?.toISOString() ?? null,
        },
        property: {
          id: lease.property.id,
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
        },
        landlord: {
          id: lease.property.landlord.id,
          name: lease.property.landlord.name,
          email: lease.property.landlord.email ?? null,
        },
        tenant: primaryTenant
          ? {
              id: primaryTenant.id,
              civility: primaryTenant.civility ?? null,
              firstName: primaryTenant.firstName,
              lastName: primaryTenant.lastName,
              email: primaryTenant.email ?? null,
            }
          : null,
        latestCertificate: latestCert
          ? {
              id: latestCert.id,
              startDate: latestCert.startDate.toISOString(),
              endDate: latestCert.endDate?.toISOString() ?? null,
              documentPath: latestCert.documentPath ?? null,
            }
          : null,
        insuranceStatus,
        daysUntilExpiry,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching insurance by lease:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance data' }, { status: 500 });
  }
}
