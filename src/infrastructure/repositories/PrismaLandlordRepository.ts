import { PrismaClient } from '@prisma/client';
import { ILandlordRepository } from '../../use-cases/interfaces/ILandlordRepository';
import { Landlord, LandlordType } from '../../domain/entities/Landlord';
import { Email } from '../../domain/value-objects/Email';

export class PrismaLandlordRepository implements ILandlordRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Landlord | null> {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id },
    });

    if (!landlord) return null;

    return this.toDomain(landlord);
  }

  async findByUserId(userId: string): Promise<Landlord[]> {
    const landlords = await this.prisma.landlord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return landlords.map(landlord => this.toDomain(landlord));
  }

  async create(landlord: Landlord): Promise<Landlord> {
    const created = await this.prisma.landlord.create({
      data: {
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
        note: landlord.note,
        userId: landlord.userId,
      },
    });

    return this.toDomain(created);
  }

  async update(landlord: Landlord): Promise<Landlord> {
    const updated = await this.prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        name: landlord.name,
        type: landlord.type,
        address: landlord.address,
        email: landlord.email?.getValue(),
        phone: landlord.phone,
        siret: landlord.siret,
        managerName: landlord.managerName,
        managerEmail: landlord.managerEmail?.getValue(),
        managerPhone: landlord.managerPhone,
        note: landlord.note,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.landlord.delete({
      where: { id },
    });
  }

  private toDomain(raw: any): Landlord {
    return Landlord.create({
      id: raw.id,
      name: raw.name,
      type: raw.type as LandlordType,
      address: raw.address,
      email: raw.email ? Email.create(raw.email) : undefined,
      phone: raw.phone,
      siret: raw.siret,
      managerName: raw.managerName,
      managerEmail: raw.managerEmail ? Email.create(raw.managerEmail) : undefined,
      managerPhone: raw.managerPhone,
      note: raw.note,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
