import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBuildingRepository } from '@/features/building/infrastructure/PrismaBuildingRepository';
import { CreateBuilding } from '@/features/building/application/CreateBuilding';

// GET /api/buildings - List all buildings
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repository = new PrismaBuildingRepository(prisma);
    const buildings = await repository.findAll();

    return NextResponse.json(
      buildings.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        postalCode: b.postalCode,
        city: b.city,
        fullAddress: b.getFullAddress(),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
}

// POST /api/buildings - Create a new building
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, address, postalCode, city } = body;

    if (!name || !address || !postalCode || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, postalCode, city' },
        { status: 400 }
      );
    }

    const repository = new PrismaBuildingRepository(prisma);
    const createBuilding = new CreateBuilding(repository);

    const building = await createBuilding.execute({
      name,
      address,
      postalCode,
      city,
    });

    return NextResponse.json(
      {
        id: building.id,
        name: building.name,
        address: building.address,
        postalCode: building.postalCode,
        city: building.city,
        fullAddress: building.getFullAddress(),
        createdAt: building.createdAt.toISOString(),
        updatedAt: building.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating building:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}
