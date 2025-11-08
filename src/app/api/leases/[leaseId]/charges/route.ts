import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leaseId } = await params;

    // Verify lease exists and belongs to user
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          include: {
            landlord: true,
          },
        },
        charges: {
          orderBy: { chargeDate: 'desc' },
        },
      },
    });

    if (!lease || lease.property.landlord.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Lease not found or unauthorized' },
        { status: 404 }
      );
    }

    // Return charges in API format
    const charges = lease.charges.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      chargeDate: charge.chargeDate.toISOString(),
      description: charge.description,
      createdAt: charge.createdAt.toISOString(),
    }));

    return NextResponse.json(charges);
  } catch (error) {
    console.error('Error fetching charges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}
