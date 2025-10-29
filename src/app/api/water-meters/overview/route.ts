import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/water-meters/overview - Get all water meter readings with property info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const properties = await prisma.property.findMany({
      include: {
        landlord: true,
        waterMeterReadings: {
          orderBy: { readingDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const propertiesWithLatestReading = properties.map((property) => ({
      property: {
        id: property.id,
        name: property.name,
        address: `${property.address}, ${property.postalCode} ${property.city}`,
        landlordName: property.landlord.name,
      },
      latestReading: property.waterMeterReadings[0]
        ? {
            id: property.waterMeterReadings[0].id,
            readingDate: property.waterMeterReadings[0].readingDate.toISOString(),
            value: property.waterMeterReadings[0].meterReading,
            photoPath: property.waterMeterReadings[0].documentPath,
            createdAt: property.waterMeterReadings[0].createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json(propertiesWithLatestReading);
  } catch (error) {
    console.error('Error fetching water meters overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water meters' },
      { status: 500 }
    );
  }
}
