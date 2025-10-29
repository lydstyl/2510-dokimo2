import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { randomUUID } from 'crypto';

// POST /api/inventories/[id]/assessments - Add/update assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: inventoryId } = await params;
    const body = await request.json();
    const { itemName, aspect, condition, comments } = body;

    if (!itemName || !aspect || !condition) {
      return NextResponse.json(
        { error: 'itemName, aspect, and condition are required' },
        { status: 400 }
      );
    }

    // Check if assessment already exists
    const existing = await prisma.inventoryAssessment.findFirst({
      where: {
        inventoryId,
        itemName,
        aspect,
      },
    });

    let assessment;
    if (existing) {
      // Update existing
      assessment = await prisma.inventoryAssessment.update({
        where: { id: existing.id },
        data: {
          condition,
          comments,
        },
      });
    } else {
      // Create new
      assessment = await prisma.inventoryAssessment.create({
        data: {
          id: randomUUID(),
          inventoryId,
          itemName,
          aspect,
          condition,
          comments,
        },
      });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error saving assessment:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
