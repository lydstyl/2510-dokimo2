import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBoilerRepository } from '@/features/boiler/infrastructure/PrismaBoilerRepository';
import { PrismaBoilerMaintenanceRepository } from '@/features/boiler/infrastructure/PrismaBoilerMaintenanceRepository';
import { GetBoilersWithMaintenance } from '@/features/boiler/application/GetBoilersWithMaintenance';

// GET /api/properties/[id]/boilers - Get all boilers with their latest maintenance for a property
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

    const boilerRepository = new PrismaBoilerRepository(prisma);
    const maintenanceRepository = new PrismaBoilerMaintenanceRepository(prisma);
    const getBoilersWithMaintenance = new GetBoilersWithMaintenance(
      boilerRepository,
      maintenanceRepository
    );

    const boilersWithMaintenance = await getBoilersWithMaintenance.execute(propertyId);

    return NextResponse.json(
      boilersWithMaintenance.map(({ boiler, latestMaintenance }) => ({
        boiler: {
          id: boiler.id,
          propertyId: boiler.propertyId,
          name: boiler.name,
          notes: boiler.notes,
          createdAt: boiler.createdAt.toISOString(),
          updatedAt: boiler.updatedAt.toISOString(),
        },
        latestMaintenance: latestMaintenance
          ? {
              id: latestMaintenance.id,
              boilerId: latestMaintenance.boilerId,
              maintenanceDate: latestMaintenance.maintenanceDate.toISOString(),
              documentPath: latestMaintenance.documentPath,
              createdAt: latestMaintenance.createdAt.toISOString(),
              updatedAt: latestMaintenance.updatedAt.toISOString(),
              isOverdue: latestMaintenance.isOverdue(),
              monthsSinceLastMaintenance: latestMaintenance.monthsSinceLastMaintenance(),
              nextMaintenanceDate: latestMaintenance.nextMaintenanceDate().toISOString(),
            }
          : null,
      }))
    );
  } catch (error) {
    console.error('Error fetching boilers with maintenance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boilers with maintenance' },
      { status: 500 }
    );
  }
}
