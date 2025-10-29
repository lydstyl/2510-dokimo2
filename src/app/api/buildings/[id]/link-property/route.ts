import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// POST /api/buildings/[id]/link-property - Link property to building
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
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
    }

    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Link property to building
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking property to building:', error);
    return NextResponse.json({ error: 'Failed to link property' }, { status: 500 });
  }
}

// DELETE /api/buildings/[id]/link-property - Unlink property from building
export async function DELETE(
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
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
    }

    // Unlink property from building
    await prisma.property.update({
      where: { id: propertyId },
      data: { buildingId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking property from building:', error);
    return NextResponse.json({ error: 'Failed to unlink property' }, { status: 500 });
  }
}
