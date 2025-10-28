import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaPropertyRepository } from '@/infrastructure/repositories/PrismaPropertyRepository';
import { CreateProperty } from '@/use-cases/CreateProperty';
import { PropertyType } from '@/domain/entities/Property';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      include: {
        landlord: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      properties.map(property => ({
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
        landlordId: property.landlordId,
        landlord: {
          id: property.landlord.id,
          name: property.landlord.name,
        },
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching properties:', error);
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
    const { name, type, address, postalCode, city, landlordId } = body;

    if (!name || !type || !address || !postalCode || !city || !landlordId) {
      return NextResponse.json(
        { error: 'Name, type, address, postal code, city, and landlord are required' },
        { status: 400 }
      );
    }

    const repository = new PrismaPropertyRepository(prisma);
    const useCase = new CreateProperty(repository);

    const property = await useCase.execute({
      name,
      type: type as PropertyType,
      address,
      postalCode,
      city,
      landlordId,
    });

    return NextResponse.json(
      {
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
        landlordId: property.landlordId,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
