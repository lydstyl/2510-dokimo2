import { PrismaClient } from '@prisma/client';
import { PropertyChargeShare } from '../domain/PropertyChargeShare';
import { DocumentCategory } from '../domain/FinancialDocument';
import { IPropertyChargeShareRepository } from '../application/interfaces/IPropertyChargeShareRepository';
import { randomUUID } from 'crypto';

export class PrismaPropertyChargeShareRepository implements IPropertyChargeShareRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PropertyChargeShare | null> {
    const share = await this.prisma.propertyChargeShare.findUnique({
      where: { id },
    });

    if (!share) return null;
    return this.toDomain(share);
  }

  async findByPropertyId(propertyId: string): Promise<PropertyChargeShare[]> {
    const shares = await this.prisma.propertyChargeShare.findMany({
      where: { propertyId },
      orderBy: { category: 'asc' },
    });

    return shares.map((s) => this.toDomain(s));
  }

  async findByPropertyIdAndCategory(
    propertyId: string,
    category: DocumentCategory
  ): Promise<PropertyChargeShare | null> {
    const share = await this.prisma.propertyChargeShare.findUnique({
      where: {
        propertyId_category: {
          propertyId,
          category,
        },
      },
    });

    if (!share) return null;
    return this.toDomain(share);
  }

  async findByBuildingId(buildingId: string): Promise<PropertyChargeShare[]> {
    const shares = await this.prisma.propertyChargeShare.findMany({
      where: {
        property: {
          buildingId,
        },
      },
      include: {
        property: true,
      },
    });

    return shares.map((s) => this.toDomain(s));
  }

  async create(share: PropertyChargeShare): Promise<PropertyChargeShare> {
    const created = await this.prisma.propertyChargeShare.create({
      data: {
        id: share.id,
        propertyId: share.propertyId,
        category: share.category,
        percentage: share.percentage,
      },
    });

    return this.toDomain(created);
  }

  async update(share: PropertyChargeShare): Promise<PropertyChargeShare> {
    const updated = await this.prisma.propertyChargeShare.update({
      where: { id: share.id },
      data: {
        percentage: share.percentage,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.propertyChargeShare.delete({
      where: { id },
    });
  }

  async upsert(
    propertyId: string,
    category: DocumentCategory,
    percentage: number
  ): Promise<PropertyChargeShare> {
    const existing = await this.findByPropertyIdAndCategory(propertyId, category);

    if (existing) {
      const updated = PropertyChargeShare.create({
        id: existing.id,
        propertyId,
        category,
        percentage,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      });
      return await this.update(updated);
    } else {
      const created = PropertyChargeShare.create({
        id: randomUUID(),
        propertyId,
        category,
        percentage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return await this.create(created);
    }
  }

  private toDomain(prismaShare: any): PropertyChargeShare {
    return PropertyChargeShare.create({
      id: prismaShare.id,
      propertyId: prismaShare.propertyId,
      category: prismaShare.category as DocumentCategory,
      percentage: prismaShare.percentage,
      createdAt: prismaShare.createdAt,
      updatedAt: prismaShare.updatedAt,
    });
  }
}
