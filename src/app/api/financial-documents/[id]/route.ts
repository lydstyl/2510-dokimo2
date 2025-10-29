import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaFinancialDocumentRepository } from '@/features/financial-document/infrastructure/PrismaFinancialDocumentRepository';
import { FinancialDocument, DocumentCategory } from '@/features/financial-document/domain/FinancialDocument';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// PATCH /api/financial-documents/[id] - Update financial document
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

    const repository = new PrismaFinancialDocumentRepository(prisma);
    const existing = await repository.findById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const category = (formData.get('category') as string) || existing.category;
    const dateStr = (formData.get('date') as string) || existing.date.toISOString();
    const amountStr = (formData.get('amount') as string) || existing.amount.toString();
    const description = (formData.get('description') as string) || existing.description;
    const includedInChargesStr = formData.get('includedInCharges') as string | null;
    const waterConsumptionStr = formData.get('waterConsumption') as string | null;
    const document = formData.get('document') as File | null;

    const amount = parseFloat(amountStr);
    const waterConsumption = waterConsumptionStr ? parseFloat(waterConsumptionStr) : existing.waterConsumption;
    const includedInCharges = includedInChargesStr !== null ? includedInChargesStr === 'true' : existing.isIncludedInCharges;

    let documentPath = existing.documentPath;

    // Handle file upload
    if (document) {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = document.name.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'financial-documents');

      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);

      documentPath = `/uploads/financial-documents/${filename}`;
    }

    const updated = FinancialDocument.create({
      id: existing.id,
      buildingId: existing.buildingId,
      category: category as DocumentCategory,
      date: new Date(dateStr),
      amount,
      description,
      documentPath,
      includedInCharges,
      waterConsumption,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const result = await repository.update(updated);

    return NextResponse.json({
      id: result.id,
      buildingId: result.buildingId,
      category: result.category,
      date: result.date.toISOString(),
      amount: result.amount,
      description: result.description,
      documentPath: result.documentPath,
      includedInCharges: result.isIncludedInCharges,
      waterConsumption: result.waterConsumption,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating financial document:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update financial document' },
      { status: 500 }
    );
  }
}

// DELETE /api/financial-documents/[id] - Delete financial document
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

    const repository = new PrismaFinancialDocumentRepository(prisma);
    await repository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting financial document:', error);
    return NextResponse.json(
      { error: 'Failed to delete financial document' },
      { status: 500 }
    );
  }
}
