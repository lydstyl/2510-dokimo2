import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { randomUUID } from 'crypto';

// GET /api/properties/[id]/inventories - Get inventories for a property
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

    const inventories = await prisma.inventory.findMany({
      where: { propertyId },
      include: {
        lease: {
          include: {
            tenants: {
                  include: {
                    tenant: true,
                  },
                },
          },
        },
        template: true,
        assessments: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(inventories);
  } catch (error) {
    console.error('Error fetching inventories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventories' },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/inventories - Create a new inventory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: propertyId } = await params;
    const body = await request.json();
    const { type, date, leaseId, templateId, notes } = body;

    if (!type || !date) {
      return NextResponse.json(
        { error: 'Type and date are required' },
        { status: 400 }
      );
    }

    const inventory = await prisma.inventory.create({
      data: {
        id: randomUUID(),
        propertyId,
        type,
        date: new Date(date),
        leaseId: leaseId || null,
        templateId: templateId || null,
        notes,
      },
      include: {
        lease: {
          include: {
            tenants: {
                  include: {
                    tenant: true,
                  },
                },
          },
        },
        template: {
          include: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
}
