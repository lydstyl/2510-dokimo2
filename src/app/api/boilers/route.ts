import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBoilerRepository } from '@/features/boiler/infrastructure/PrismaBoilerRepository';
import { CreateBoiler } from '@/features/boiler/application/CreateBoiler';

// GET /api/boilers?propertyId=xxx - Get all boilers for a property
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const repository = new PrismaBoilerRepository(prisma);
    const boilers = await repository.findByPropertyId(propertyId);

    return NextResponse.json(
      boilers.map((b) => ({
        id: b.id,
        propertyId: b.propertyId,
        name: b.name,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching boilers:', error);
    return NextResponse.json({ error: 'Failed to fetch boilers' }, { status: 500 });
  }
}

// POST /api/boilers - Create a new boiler
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId, name, notes } = body;

    if (!propertyId || propertyId.trim() === '') {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const repository = new PrismaBoilerRepository(prisma);
    const createBoiler = new CreateBoiler(repository);

    const boiler = await createBoiler.execute({
      propertyId,
      name,
      notes,
    });

    return NextResponse.json(
      {
        id: boiler.id,
        propertyId: boiler.propertyId,
        name: boiler.name,
        notes: boiler.notes,
        createdAt: boiler.createdAt.toISOString(),
        updatedAt: boiler.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating boiler:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create boiler' }, { status: 500 });
  }
}
