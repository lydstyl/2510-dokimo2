import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaWaterMeterReadingRepository } from '@/features/water-meter/infrastructure/PrismaWaterMeterReadingRepository';
import { UpdateWaterMeterReading } from '@/features/water-meter/application/UpdateWaterMeterReading';
import { DeleteWaterMeterReading } from '@/features/water-meter/application/DeleteWaterMeterReading';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// PATCH /api/water-meter/[id] - Update water meter reading
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const readingDateStr = formData.get('readingDate') as string | null;
    const meterReadingStr = formData.get('meterReading') as string | null;
    const document = formData.get('document') as File | null;

    const readingDate = readingDateStr ? new Date(readingDateStr) : undefined;
    const meterReading = meterReadingStr ? parseFloat(meterReadingStr) : undefined;

    if (meterReading !== undefined && isNaN(meterReading)) {
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
    const updateReading = new UpdateWaterMeterReading(repository);

    const reading = await updateReading.execute({
      id,
      readingDate,
      meterReading,
      documentPath,
    });

    return NextResponse.json({
      id: reading.id,
      propertyId: reading.propertyId,
      readingDate: reading.readingDate.toISOString(),
      meterReading: reading.meterReading,
      documentPath: reading.documentPath,
      createdAt: reading.createdAt.toISOString(),
      updatedAt: reading.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating water meter reading:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update water meter reading' }, { status: 500 });
  }
}

// DELETE /api/water-meter/[id] - Delete water meter reading
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

    const repository = new PrismaWaterMeterReadingRepository(prisma);
    const deleteReading = new DeleteWaterMeterReading(repository);

    await deleteReading.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting water meter reading:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete water meter reading' }, { status: 500 });
  }
}
