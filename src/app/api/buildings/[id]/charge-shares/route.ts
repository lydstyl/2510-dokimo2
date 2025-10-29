import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaPropertyChargeShareRepository } from '@/features/financial-document/infrastructure/PrismaPropertyChargeShareRepository';

// GET /api/buildings/[id]/charge-shares - Get all charge shares for properties in building
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: buildingId } = await params;

    // Get all properties in building
    const properties = await prisma.property.findMany({
      where: { buildingId },
      orderBy: { name: 'asc' },
    });

    // Get all charge shares for these properties
    const repository = new PrismaPropertyChargeShareRepository(prisma);
    const allShares = await repository.findByBuildingId(buildingId);

    // Group shares by property
    const result = properties.map((property) => {
      const propertyShares = allShares.filter((s) => s.propertyId === property.id);

      return {
        propertyId: property.id,
        propertyName: property.name,
        shares: propertyShares.map((s) => ({
          id: s.id,
          category: s.category,
          percentage: s.percentage,
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching charge shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charge shares' },
      { status: 500 }
    );
  }
}

// POST /api/buildings/[id]/charge-shares - Set charge share for a property
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: buildingId } = await params;
    const body = await request.json();
    const { propertyId, category, percentage } = body;

    if (!propertyId || !category || percentage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, category, percentage' },
        { status: 400 }
      );
    }

    // Verify property belongs to building
    const property = await prisma.property.findFirst({
      where: { id: propertyId, buildingId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found in this building' },
        { status: 404 }
      );
    }

    const repository = new PrismaPropertyChargeShareRepository(prisma);
    const share = await repository.upsert(propertyId, category, percentage);

    return NextResponse.json({
      id: share.id,
      propertyId: share.propertyId,
      category: share.category,
      percentage: share.percentage,
    });
  } catch (error) {
    console.error('Error setting charge share:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to set charge share' },
      { status: 500 }
    );
  }
}
