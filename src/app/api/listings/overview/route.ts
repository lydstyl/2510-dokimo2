import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/listings/overview - Get all property listings with property info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const listings = await prisma.propertyListing.findMany({
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const listingsWithInfo = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      status: listing.status,
      property: {
        id: listing.property.id,
        name: listing.property.name,
        address: `${listing.property.address}, ${listing.property.postalCode} ${listing.property.city}`,
        landlordName: listing.property.landlord.name,
      },
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }));

    return NextResponse.json(listingsWithInfo);
  } catch (error) {
    console.error('Error fetching listings overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
