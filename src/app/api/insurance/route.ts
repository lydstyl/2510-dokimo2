import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaInsuranceCertificateRepository } from '@/features/insurance/infrastructure/PrismaInsuranceCertificateRepository';
import { CreateInsuranceCertificate } from '@/features/insurance/application/CreateInsuranceCertificate';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/insurance - Create insurance certificate with optional file upload
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const propertyId = formData.get('propertyId') as string;
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string | null;
    const document = formData.get('document') as File | null;

    if (!propertyId || propertyId.trim() === '') {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!startDateStr) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    let documentPath: string | undefined;

    // Handle file upload if present
    if (document) {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = document.name.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'insurance');

      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      documentPath = `/uploads/insurance/${filename}`;
    }

    const repository = new PrismaInsuranceCertificateRepository(prisma);
    const createCertificate = new CreateInsuranceCertificate(repository);

    const certificate = await createCertificate.execute({
      propertyId,
      startDate,
      endDate,
      documentPath,
    });

    return NextResponse.json(
      {
        id: certificate.id,
        propertyId: certificate.propertyId,
        startDate: certificate.startDate.toISOString(),
        endDate: certificate.endDate?.toISOString(),
        documentPath: certificate.documentPath,
        createdAt: certificate.createdAt.toISOString(),
        updatedAt: certificate.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating insurance certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create insurance certificate' }, { status: 500 });
  }
}
