import { NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/features/rent-revision/infrastructure/PrismaRentRevisionRepository';
import { GetRevisionStats } from '@/features/rent-revision/application/GetRevisionStats';

/**
 * GET /api/rent-revisions/stats
 * Get statistics about rent revisions for dashboard indicators
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repository = new PrismaRentRevisionRepository(prisma);
    const useCase = new GetRevisionStats(repository);
    const stats = await useCase.execute();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting revision stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
