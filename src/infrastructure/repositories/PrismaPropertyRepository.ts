import { PrismaClient } from '@prisma/client';
import { IPropertyRepository } from '../../use-cases/interfaces/IPropertyRepository';
import { Property, PropertyType } from '../../domain/entities/Property';

export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Property | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) return null;

    return this.toDomain(property);
  }

  async findByLandlordId(landlordId: string): Promise<Property[]> {
    const properties = await this.prisma.property.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map(property => this.toDomain(property));
  }

  async create(property: Property): Promise<Property> {
    const created = await this.prisma.property.create({
      data: {
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
        note: property.note,
        landlordId: property.landlordId,
      },
    });

    return this.toDomain(created);
  }

  async update(property: Property): Promise<Property> {
    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: {
        name: property.name,
        type: property.type,
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
        note: property.note,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.property.delete({
      where: { id },
    });
  }

  private toDomain(raw: any): Property {
    return Property.create({
      id: raw.id,
      name: raw.name,
      type: raw.type as PropertyType,
      address: raw.address,
      postalCode: raw.postalCode,
      city: raw.city,
      note: raw.note,
      landlordId: raw.landlordId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
