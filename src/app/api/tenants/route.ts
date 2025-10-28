import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaTenantRepository } from '@/infrastructure/repositories/PrismaTenantRepository';
import { CreateTenant } from '@/use-cases/CreateTenant';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = new PrismaTenantRepository(prisma);
    const tenants = await repository.findAll();

    return NextResponse.json(
      tenants.map(tenant => ({
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const repository = new PrismaTenantRepository(prisma);
    const useCase = new CreateTenant(repository);

    const tenant = await useCase.execute({
      firstName,
      lastName,
      email,
      phone,
    });

    return NextResponse.json(
      {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email?.getValue(),
        phone: tenant.phone,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
