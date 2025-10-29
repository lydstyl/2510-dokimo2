import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaWaterMeterReadingRepository } from '@/features/water-meter/infrastructure/PrismaWaterMeterReadingRepository';
import { CreateWaterMeterReading } from '@/features/water-meter/application/CreateWaterMeterReading';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/water-meter - Create water meter reading with optional file upload
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const propertyId = formData.get('propertyId') as string;
    const readingDateStr = formData.get('readingDate') as string;
    const meterReadingStr = formData.get('meterReading') as string;
    const document = formData.get('document') as File | null;

    if (!propertyId || propertyId.trim() === '') {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!readingDateStr) {
      return NextResponse.json({ error: 'Reading date is required' }, { status: 400 });
    }

    if (!meterReadingStr) {
      return NextResponse.json({ error: 'Meter reading is required' }, { status: 400 });
    }

    const readingDate = new Date(readingDateStr);
    const meterReading = parseFloat(meterReadingStr);

    if (isNaN(meterReading)) {
      return NextResponse.json({ error: 'Invalid meter reading value' }, { status: 400 });
    }

    let documentPath: string | undefined;

    // Handle file upload if present
    if (document) {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = document.name.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'water-meter');

      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      documentPath = `/uploads/water-meter/${filename}`;
    }

    const repository = new PrismaWaterMeterReadingRepository(prisma);
    const createReading = new CreateWaterMeterReading(repository);

    const reading = await createReading.execute({
      propertyId,
      readingDate,
      meterReading,
      documentPath,
    });

    return NextResponse.json(
      {
        id: reading.id,
        propertyId: reading.propertyId,
        readingDate: reading.readingDate.toISOString(),
        meterReading: reading.meterReading,
        documentPath: reading.documentPath,
        createdAt: reading.createdAt.toISOString(),
        updatedAt: reading.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating water meter reading:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create water meter reading' }, { status: 500 });
  }
}
