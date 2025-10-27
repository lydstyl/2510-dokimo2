import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaLandlordRepository } from '@/infrastructure/repositories/PrismaLandlordRepository';
import { CreateLandlord } from '@/use-cases/CreateLandlord';
import { LandlordType } from '@/domain/entities/Landlord';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = new PrismaLandlordRepository(prisma);

    // For now, use a hardcoded user ID since we only have one user
    const userId = 'user-1';
    const landlords = await repository.findByUserId(userId);

    return NextResponse.json(
      landlords.map(landlord => ({
        id: landlord.id,
        name: landlord.name,
        type: landlord.type,
        address: landlord.address,
        email: landlord.email?.getValue(),
        phone: landlord.phone,
        siret: landlord.siret,
        managerName: landlord.managerName,
        managerEmail: landlord.managerEmail?.getValue(),
        managerPhone: landlord.managerPhone,
        createdAt: landlord.createdAt,
        updatedAt: landlord.updatedAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching landlords:', error);
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
    const { name, type, address, email, phone, siret, managerName, managerEmail, managerPhone } = body;

    if (!name || !type || !address) {
      return NextResponse.json(
        { error: 'Name, type, and address are required' },
        { status: 400 }
      );
    }

    const repository = new PrismaLandlordRepository(prisma);
    const useCase = new CreateLandlord(repository);

    const landlord = await useCase.execute({
      name,
      type: type as LandlordType,
      address,
      email,
      phone,
      siret,
      managerName,
      managerEmail,
      managerPhone,
      userId: 'user-1', // Hardcoded for now
    });

    return NextResponse.json(
      {
        id: landlord.id,
        name: landlord.name,
        type: landlord.type,
        address: landlord.address,
        email: landlord.email?.getValue(),
        phone: landlord.phone,
        siret: landlord.siret,
        managerName: landlord.managerName,
        managerEmail: landlord.managerEmail?.getValue(),
        managerPhone: landlord.managerPhone,
        createdAt: landlord.createdAt,
        updatedAt: landlord.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating landlord:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
