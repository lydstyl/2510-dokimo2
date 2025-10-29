import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBoilerRepository } from '@/features/boiler/infrastructure/PrismaBoilerRepository';
import { UpdateBoiler } from '@/features/boiler/application/UpdateBoiler';
import { DeleteBoiler } from '@/features/boiler/application/DeleteBoiler';

// PATCH /api/boilers/[id] - Update a boiler
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
    const body = await request.json();
    const { name, notes } = body;

    const repository = new PrismaBoilerRepository(prisma);
    const updateBoiler = new UpdateBoiler(repository);

    const boiler = await updateBoiler.execute({
      id,
      name,
      notes,
    });

    return NextResponse.json({
      id: boiler.id,
      propertyId: boiler.propertyId,
      name: boiler.name,
      notes: boiler.notes,
      createdAt: boiler.createdAt.toISOString(),
      updatedAt: boiler.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating boiler:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update boiler' }, { status: 500 });
  }
}

// DELETE /api/boilers/[id] - Delete a boiler
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

    const repository = new PrismaBoilerRepository(prisma);
    const deleteBoiler = new DeleteBoiler(repository);

    await deleteBoiler.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting boiler:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete boiler' }, { status: 500 });
  }
}
