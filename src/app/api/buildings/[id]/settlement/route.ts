import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaFinancialDocumentRepository } from '@/features/financial-document/infrastructure/PrismaFinancialDocumentRepository';
import { PrismaPropertyChargeShareRepository } from '@/features/financial-document/infrastructure/PrismaPropertyChargeShareRepository';
import { CalculateChargeSettlement } from '@/features/financial-document/application/CalculateChargeSettlement';

// POST /api/buildings/[id]/settlement - Calculate charge settlement for a property
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
    const body = await request.json();
    const { propertyId, provisionalChargesPaid, referenceDate } = body;

    if (!propertyId || provisionalChargesPaid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, provisionalChargesPaid' },
        { status: 400 }
      );
    }

    // Verify property belongs to building
    const property = await prisma.property.findFirst({
      where: { id: propertyId, buildingId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found in this building' },
        { status: 404 }
      );
    }

    // Get water meter readings for this property
    const waterReadings = await prisma.waterMeterReading.findMany({
      where: { propertyId },
      orderBy: { readingDate: 'desc' },
    });

    const financialDocRepository = new PrismaFinancialDocumentRepository(prisma);
    const chargeShareRepository = new PrismaPropertyChargeShareRepository(prisma);

    const calculateSettlement = new CalculateChargeSettlement(
      financialDocRepository,
      chargeShareRepository
    );

    const result = await calculateSettlement.execute({
      buildingId,
      propertyId,
      referenceDate: referenceDate ? new Date(referenceDate) : undefined,
      waterReadings: waterReadings.map((r) => ({
        readingDate: r.readingDate,
        meterReading: r.meterReading,
      })),
      provisionalChargesPaid: parseFloat(provisionalChargesPaid),
    });

    return NextResponse.json({
      propertyId: result.propertyId,
      buildingId: result.buildingId,
      referenceDate: result.referenceDate.toISOString(),
      periodStart: result.periodStart.toISOString(),
      periodEnd: result.periodEnd.toISOString(),
      categories: result.categories.map((cat) => ({
        category: cat.category,
        categoryLabel: cat.categoryLabel,
        documents: cat.documents.map((doc) => ({
          id: doc.id,
          date: doc.date.toISOString(),
          description: doc.description,
          amount: doc.amount,
          documentPath: doc.documentPath,
        })),
        totalAmount: cat.totalAmount,
        percentage: cat.percentage,
        propertyShare: cat.propertyShare,
        calculationMethod: cat.calculationMethod,
        waterDetails: cat.waterDetails
          ? {
              propertyConsumption: cat.waterDetails.propertyConsumption,
              buildingTotalConsumption: cat.waterDetails.buildingTotalConsumption,
              dynamicPercentage: cat.waterDetails.dynamicPercentage,
              calculationMethod: cat.waterDetails.calculationMethod,
              periodStart: cat.waterDetails.periodStart.toISOString(),
              periodEnd: cat.waterDetails.periodEnd.toISOString(),
            }
          : undefined,
      })),
      totalChargesActual: result.totalChargesActual,
      totalChargesProvisional: result.totalChargesProvisional,
      balance: result.balance,
      newMonthlyCharges: result.newMonthlyCharges,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error calculating charge settlement:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to calculate charge settlement' },
      { status: 500 }
    );
  }
}
