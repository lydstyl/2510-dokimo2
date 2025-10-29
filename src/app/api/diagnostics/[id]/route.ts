import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// PATCH /api/diagnostics/[id] - Update a diagnostic
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

    const name = formData.get('name') as string | null;
    const diagnosticDate = formData.get('diagnosticDate') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;
    const pdfFile = formData.get('pdf') as File | null;

    // Fetch existing diagnostic
    const existingDiagnostic = await prisma.propertyDiagnostic.findUnique({
      where: { id },
    });

    if (!existingDiagnostic) {
      return NextResponse.json(
        { error: 'Diagnostic not found' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      diagnosticDate?: Date;
      expiryDate?: Date;
      pdfPath?: string;
    } = {};

    if (name) updateData.name = name;
    if (diagnosticDate) updateData.diagnosticDate = new Date(diagnosticDate);
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);

    // Handle PDF file update
    if (pdfFile) {
      // Validate PDF file
      if (pdfFile.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'File must be a PDF' },
          { status: 400 }
        );
      }

      // Delete old file
      try {
        const oldFilePath = join(process.cwd(), existingDiagnostic.pdfPath);
        await unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old file:', error);
        // Continue even if deletion fails
      }

      // Save new PDF file
      const uploadsDir = join(process.cwd(), 'uploads', 'diagnostics');
      await mkdir(uploadsDir, { recursive: true });

      const fileId = randomUUID();
      const fileName = `${fileId}.pdf`;
      const filePath = join(uploadsDir, fileName);
      const relativePath = `/uploads/diagnostics/${fileName}`;

      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      updateData.pdfPath = relativePath;
    }

    // Update diagnostic record
    const diagnostic = await prisma.propertyDiagnostic.update({
      where: { id },
      data: updateData,
    });

    const now = new Date();
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error updating diagnostic:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update diagnostic' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnostics/[id] - Delete a diagnostic
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

    // Fetch diagnostic to get file path
    const diagnostic = await prisma.propertyDiagnostic.findUnique({
      where: { id },
    });

    if (!diagnostic) {
      return NextResponse.json(
        { error: 'Diagnostic not found' },
        { status: 404 }
      );
    }

    // Delete file
    try {
      const filePath = join(process.cwd(), diagnostic.pdfPath);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete diagnostic record
    await prisma.propertyDiagnostic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diagnostic:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to delete diagnostic' },
      { status: 500 }
    );
  }
}
