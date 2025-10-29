import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaFinancialDocumentRepository } from '@/features/financial-document/infrastructure/PrismaFinancialDocumentRepository';
import { FinancialDocument, DocumentCategory } from '@/features/financial-document/domain/FinancialDocument';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// GET /api/buildings/[id]/documents - Get all financial documents for a building
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: buildingId } = await params;

    const repository = new PrismaFinancialDocumentRepository(prisma);
    const documents = await repository.findByBuildingId(buildingId);

    return NextResponse.json(
      documents.map((doc) => ({
        id: doc.id,
        buildingId: doc.buildingId,
        category: doc.category,
        date: doc.date.toISOString(),
        amount: doc.amount,
        description: doc.description,
        documentPath: doc.documentPath,
        includedInCharges: doc.isIncludedInCharges,
        waterConsumption: doc.waterConsumption,
        isWaterBill: doc.isWaterBill(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching financial documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial documents' },
      { status: 500 }
    );
  }
}

// POST /api/buildings/[id]/documents - Create a new financial document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: buildingId } = await params;
    const formData = await request.formData();

    const category = formData.get('category') as string;
    const dateStr = formData.get('date') as string;
    const amountStr = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const includedInChargesStr = formData.get('includedInCharges') as string;
    const waterConsumptionStr = formData.get('waterConsumption') as string | null;
    const document = formData.get('document') as File | null;

    if (!category || !dateStr || !amountStr || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const waterConsumption = waterConsumptionStr ? parseFloat(waterConsumptionStr) : undefined;
    if (waterConsumption !== undefined && isNaN(waterConsumption)) {
      return NextResponse.json({ error: 'Invalid water consumption' }, { status: 400 });
    }

    let documentPath: string | undefined;

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

    const financialDocument = FinancialDocument.create({
      id: randomUUID(),
      buildingId,
      category: category as DocumentCategory,
      date: new Date(dateStr),
      amount,
      description,
      documentPath,
      includedInCharges: includedInChargesStr === 'true',
      waterConsumption,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repository = new PrismaFinancialDocumentRepository(prisma);
    const created = await repository.create(financialDocument);

    return NextResponse.json(
      {
        id: created.id,
        buildingId: created.buildingId,
        category: created.category,
        date: created.date.toISOString(),
        amount: created.amount,
        description: created.description,
        documentPath: created.documentPath,
        includedInCharges: created.isIncludedInCharges,
        waterConsumption: created.waterConsumption,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating financial document:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create financial document' },
      { status: 500 }
    );
  }
}
