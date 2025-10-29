import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaInsuranceCertificateRepository } from '@/features/insurance/infrastructure/PrismaInsuranceCertificateRepository';
import { UpdateInsuranceCertificate } from '@/features/insurance/application/UpdateInsuranceCertificate';
import { DeleteInsuranceCertificate } from '@/features/insurance/application/DeleteInsuranceCertificate';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// PATCH /api/insurance/[id] - Update insurance certificate
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
    const startDateStr = formData.get('startDate') as string | null;
    const endDateStr = formData.get('endDate') as string | null;
    const document = formData.get('document') as File | null;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
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
    const updateCertificate = new UpdateInsuranceCertificate(repository);

    const certificate = await updateCertificate.execute({
      id,
      startDate,
      endDate,
      documentPath,
    });

    return NextResponse.json({
      id: certificate.id,
      propertyId: certificate.propertyId,
      startDate: certificate.startDate.toISOString(),
      endDate: certificate.endDate?.toISOString(),
      documentPath: certificate.documentPath,
      createdAt: certificate.createdAt.toISOString(),
      updatedAt: certificate.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating insurance certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update insurance certificate' }, { status: 500 });
  }
}

// DELETE /api/insurance/[id] - Delete insurance certificate
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

    const repository = new PrismaInsuranceCertificateRepository(prisma);
    const deleteCertificate = new DeleteInsuranceCertificate(repository);

    await deleteCertificate.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting insurance certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete insurance certificate' }, { status: 500 });
  }
}
