import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaWaterMeterReadingRepository } from '@/features/water-meter/infrastructure/PrismaWaterMeterReadingRepository';

// GET /api/properties/[id]/water-meter - Get water meter readings for a property
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

    const repository = new PrismaWaterMeterReadingRepository(prisma);
    const readings = await repository.findByPropertyId(propertyId);

    return NextResponse.json(
      readings.map((reading) => ({
        id: reading.id,
        propertyId: reading.propertyId,
        readingDate: reading.readingDate.toISOString(),
        meterReading: reading.meterReading,
        documentPath: reading.documentPath,
        createdAt: reading.createdAt.toISOString(),
        updatedAt: reading.updatedAt.toISOString(),
        isOlderThanOneYear: reading.isOlderThanOneYear(),
        monthsSinceReading: reading.monthsSinceReading(),
      }))
    );
  } catch (error) {
    console.error('Error fetching water meter readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water meter readings' },
      { status: 500 }
    );
  }
}
