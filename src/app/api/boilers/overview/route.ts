import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/boilers/overview - Get all boilers with property and tenant info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all boilers with their property and latest maintenance
    const boilers = await prisma.boiler.findMany({
      include: {
        property: {
          include: {
            leases: {
              where: {
                startDate: { lte: new Date() },
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
              include: {
                tenants: {
                  include: {
                    tenant: true,
                  },
                },
              },
              orderBy: {
                startDate: 'desc',
              },
              take: 1,
            },
          },
        },
        maintenances: {
          orderBy: {
            maintenanceDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = boilers.map((boiler) => {
      const latestMaintenance = boiler.maintenances[0];
      const activeLease = boiler.property.leases[0];

      let monthsSinceMaintenance = null;
      let nextMaintenanceDate = null;
      let isOverdue = false;

      if (latestMaintenance) {
        const now = new Date();
        const diffTime = now.getTime() - latestMaintenance.maintenanceDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        monthsSinceMaintenance = Math.floor(diffDays / 30);
        isOverdue = monthsSinceMaintenance >= 11;

        const next = new Date(latestMaintenance.maintenanceDate);
        next.setFullYear(next.getFullYear() + 1);
        nextMaintenanceDate = next.toISOString();
      }

      return {
        boiler: {
          id: boiler.id,
          name: boiler.name,
          notes: boiler.notes,
        },
        property: {
          id: boiler.property.id,
          name: boiler.property.name,
          address: boiler.property.address,
          postalCode: boiler.property.postalCode,
          city: boiler.property.city,
        },
        tenant: activeLease && activeLease.tenants.length > 0
          ? {
              id: activeLease.tenants[0].tenant.id,
              civility: activeLease.tenants[0].tenant.civility,
              firstName: activeLease.tenants[0].tenant.firstName,
              lastName: activeLease.tenants[0].tenant.lastName,
              email: activeLease.tenants[0].tenant.email,
              phone: activeLease.tenants[0].tenant.phone,
            }
          : null,
        latestMaintenance: latestMaintenance
          ? {
              id: latestMaintenance.id,
              maintenanceDate: latestMaintenance.maintenanceDate.toISOString(),
              documentPath: latestMaintenance.documentPath,
            }
          : null,
        maintenanceStatus: {
          monthsSinceMaintenance,
          nextMaintenanceDate,
          isOverdue,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching boilers overview:', error);
    return NextResponse.json({ error: 'Failed to fetch boilers overview' }, { status: 500 });
  }
}
