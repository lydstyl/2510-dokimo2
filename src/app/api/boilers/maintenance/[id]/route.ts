import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaBoilerMaintenanceRepository } from '@/features/boiler/infrastructure/PrismaBoilerMaintenanceRepository';
import { DeleteMaintenance } from '@/features/boiler/application/DeleteMaintenance';

// DELETE /api/boilers/maintenance/[id] - Delete a maintenance record
// Note: This does NOT delete the uploaded document file - we keep it for records
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

    const repository = new PrismaBoilerMaintenanceRepository(prisma);
    const deleteMaintenance = new DeleteMaintenance(repository);

    await deleteMaintenance.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete maintenance' }, { status: 500 });
  }
}
