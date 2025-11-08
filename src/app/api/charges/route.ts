import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { AddCharge } from '@/use-cases/AddCharge';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leaseId, amount, chargeDate, description } = body;

    // Validate required fields
    if (!leaseId || amount === undefined || !chargeDate) {
      return NextResponse.json(
        { error: 'Missing required fields: leaseId, amount, chargeDate' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Verify lease exists and belongs to user
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!lease || lease.property.landlord.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Lease not found or unauthorized' },
        { status: 404 }
      );
    }

    // Add charge using use case
    const chargeRepository = new PrismaChargeRepository(prisma);
    const addCharge = new AddCharge(chargeRepository);

    const charge = await addCharge.execute({
      leaseId,
      amount: parseFloat(amount),
      chargeDate: new Date(chargeDate),
      description: description || undefined,
    });

    return NextResponse.json(
      {
        id: charge.id,
        leaseId: charge.leaseId,
        amount: charge.amount.getAmount(),
        chargeDate: charge.chargeDate.toISOString(),
        description: charge.description,
        createdAt: charge.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding charge:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add charge' },
      { status: 500 }
    );
  }
}
