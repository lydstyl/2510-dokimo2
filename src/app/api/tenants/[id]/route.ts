import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaTenantRepository } from '@/infrastructure/repositories/PrismaTenantRepository';
import { UpdateTenant } from '@/use-cases/UpdateTenant';
import { DeleteTenant } from '@/use-cases/DeleteTenant';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { civility, firstName, lastName, email, phone } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const repository = new PrismaTenantRepository(prisma);
    const useCase = new UpdateTenant(repository);

    const tenant = await useCase.execute({
      id,
      civility,
      firstName,
      lastName,
      email,
      phone,
    });

    return NextResponse.json({
      id: tenant.id,
      civility: tenant.civility,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email?.getValue(),
      phone: tenant.phone,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Tenant not found' ? 404 : 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const repository = new PrismaTenantRepository(prisma);
    const useCase = new DeleteTenant(repository);

    await useCase.execute(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Tenant not found' ? 404 : 400 }
    );
  }
}
