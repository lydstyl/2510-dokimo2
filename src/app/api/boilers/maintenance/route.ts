import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBoilerMaintenanceRepository } from '@/features/boiler/infrastructure/PrismaBoilerMaintenanceRepository';
import { RecordMaintenance } from '@/features/boiler/application/RecordMaintenance';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/boilers/maintenance - Record a maintenance with optional file upload
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const boilerId = formData.get('boilerId') as string;
    const maintenanceDateStr = formData.get('maintenanceDate') as string;
    const document = formData.get('document') as File | null;

    if (!boilerId || boilerId.trim() === '') {
      return NextResponse.json({ error: 'Boiler ID is required' }, { status: 400 });
    }

    if (!maintenanceDateStr) {
      return NextResponse.json({ error: 'Maintenance date is required' }, { status: 400 });
    }

    const maintenanceDate = new Date(maintenanceDateStr);

    let documentPath: string | undefined;

    // Handle file upload if present
    if (document) {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const ext = document.name.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'maintenance');

      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      documentPath = `/uploads/maintenance/${filename}`;
    }

    const repository = new PrismaBoilerMaintenanceRepository(prisma);
    const recordMaintenance = new RecordMaintenance(repository);

    const maintenance = await recordMaintenance.execute({
      boilerId,
      maintenanceDate,
      documentPath,
    });

    return NextResponse.json(
      {
        id: maintenance.id,
        boilerId: maintenance.boilerId,
        maintenanceDate: maintenance.maintenanceDate.toISOString(),
        documentPath: maintenance.documentPath,
        createdAt: maintenance.createdAt.toISOString(),
        updatedAt: maintenance.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording maintenance:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record maintenance' }, { status: 500 });
  }
}

// GET /api/boilers/maintenance?boilerId=xxx - Get all maintenance records for a boiler
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const boilerId = searchParams.get('boilerId');

    const repository = new PrismaBoilerMaintenanceRepository(prisma);

    if (boilerId) {
      const maintenances = await repository.findByBoilerId(boilerId);
      return NextResponse.json(
        maintenances.map((m) => ({
          id: m.id,
          boilerId: m.boilerId,
          maintenanceDate: m.maintenanceDate.toISOString(),
          documentPath: m.documentPath,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }))
      );
    } else {
      // Return all maintenances (for overview page)
      const maintenances = await repository.findAll();
      return NextResponse.json(
        maintenances.map((m) => ({
          id: m.id,
          boilerId: m.boilerId,
          maintenanceDate: m.maintenanceDate.toISOString(),
          documentPath: m.documentPath,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }))
      );
    }
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    );
  }
}
