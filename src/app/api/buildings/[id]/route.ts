import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/buildings/[id] - Get building with properties
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            landlord: true,
            leases: {
              include: {
                tenant: true,
              },
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: building.id,
      name: building.name,
      address: building.address,
      postalCode: building.postalCode,
      city: building.city,
      properties: building.properties.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address,
        landlord: {
          id: p.landlord.id,
          name: p.landlord.name,
        },
        activeLease: p.leases[0]
          ? {
              tenant: {
                firstName: p.leases[0].tenant.firstName,
                lastName: p.leases[0].tenant.lastName,
              },
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching building:', error);
    return NextResponse.json({ error: 'Failed to fetch building' }, { status: 500 });
  }
}

// DELETE /api/buildings/[id] - Delete building
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.building.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting building:', error);
    return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
  }
}
