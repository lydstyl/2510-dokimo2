import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/diagnostics/overview - Get all diagnostics with property info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const diagnostics = await prisma.propertyDiagnostic.findMany({
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    const diagnosticsWithStatus = diagnostics.map((diagnostic) => ({
      id: diagnostic.id,
      name: diagnostic.name,
      diagnosticDate: diagnostic.diagnosticDate.toISOString(),
      expiryDate: diagnostic.expiryDate.toISOString(),
      pdfPath: diagnostic.pdfPath,
      property: {
        id: diagnostic.property.id,
        name: diagnostic.property.name,
        address: `${diagnostic.property.address}, ${diagnostic.property.postalCode} ${diagnostic.property.city}`,
        landlordName: diagnostic.property.landlord.name,
      },
      isValid: diagnostic.expiryDate > now,
      daysUntilExpiry: Math.ceil(
        (diagnostic.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      createdAt: diagnostic.createdAt.toISOString(),
      updatedAt: diagnostic.updatedAt.toISOString(),
    }));

    return NextResponse.json(diagnosticsWithStatus);
  } catch (error) {
    console.error('Error fetching diagnostics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnostics' },
      { status: 500 }
    );
  }
}
