import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/inventories/overview - Get all inventories with property info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inventories = await prisma.inventory.findMany({
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
        lease: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const inventoriesWithInfo = inventories.map((inventory) => ({
      id: inventory.id,
      type: inventory.type,
      inventoryDate: inventory.date.toISOString(),
      pdfPath: null, // PDF generation is done via a separate process
      property: {
        id: inventory.property.id,
        name: inventory.property.name,
        address: `${inventory.property.address}, ${inventory.property.postalCode} ${inventory.property.city}`,
        landlordName: inventory.property.landlord.name,
      },
      tenant: inventory.lease
        ? {
            name: `${inventory.lease.tenant.civility || ''} ${inventory.lease.tenant.firstName} ${inventory.lease.tenant.lastName}`.trim(),
          }
        : null,
      createdAt: inventory.createdAt.toISOString(),
      updatedAt: inventory.updatedAt.toISOString(),
    }));

    return NextResponse.json(inventoriesWithInfo);
  } catch (error) {
    console.error('Error fetching inventories overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventories' },
      { status: 500 }
    );
  }
}
