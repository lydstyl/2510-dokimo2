import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// GET /api/properties/[id]/diagnostics - Get all diagnostics for a property
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

    const diagnostics = await prisma.propertyDiagnostic.findMany({
      where: { propertyId },
      orderBy: { diagnosticDate: 'desc' },
    });

    // Add validity status to each diagnostic
    const now = new Date();
    const diagnosticsWithStatus = diagnostics.map((diagnostic) => ({
      id: diagnostic.id,
      propertyId: diagnostic.propertyId,
      name: diagnostic.name,
      diagnosticDate: diagnostic.diagnosticDate.toISOString(),
      expiryDate: diagnostic.expiryDate.toISOString(),
      pdfPath: diagnostic.pdfPath,
      isValid: diagnostic.expiryDate > now,
      daysUntilExpiry: Math.ceil(
        (diagnostic.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      createdAt: diagnostic.createdAt.toISOString(),
      updatedAt: diagnostic.updatedAt.toISOString(),
    }));

    return NextResponse.json(diagnosticsWithStatus);
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnostics' },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/diagnostics - Create a new diagnostic
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: propertyId } = await params;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const diagnosticDate = formData.get('diagnosticDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const pdfFile = formData.get('pdf') as File;

    if (!name || !diagnosticDate || !expiryDate || !pdfFile) {
      return NextResponse.json(
        { error: 'Name, diagnostic date, expiry date, and PDF are required' },
        { status: 400 }
      );
    }

    // Validate PDF file
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Save PDF file
    const uploadsDir = join(process.cwd(), 'uploads', 'diagnostics');
    await mkdir(uploadsDir, { recursive: true });

    const fileId = randomUUID();
    const fileName = `${fileId}.pdf`;
    const filePath = join(uploadsDir, fileName);
    const relativePath = `/uploads/diagnostics/${fileName}`;

    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create diagnostic record
    const diagnostic = await prisma.propertyDiagnostic.create({
      data: {
        id: randomUUID(),
        propertyId,
        name,
        diagnosticDate: new Date(diagnosticDate),
        expiryDate: new Date(expiryDate),
        pdfPath: relativePath,
      },
    });

    const now = new Date();
    return NextResponse.json(
      {
        id: diagnostic.id,
        propertyId: diagnostic.propertyId,
        name: diagnostic.name,
        diagnosticDate: diagnostic.diagnosticDate.toISOString(),
        expiryDate: diagnostic.expiryDate.toISOString(),
        pdfPath: diagnostic.pdfPath,
        isValid: diagnostic.expiryDate > now,
        daysUntilExpiry: Math.ceil(
          (diagnostic.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        createdAt: diagnostic.createdAt.toISOString(),
        updatedAt: diagnostic.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating diagnostic:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create diagnostic' },
      { status: 500 }
    );
  }
}
