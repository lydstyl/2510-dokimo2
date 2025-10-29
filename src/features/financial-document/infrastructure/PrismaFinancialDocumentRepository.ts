import { PrismaClient } from '@prisma/client';
import { FinancialDocument, DocumentCategory } from '../domain/FinancialDocument';
import { IFinancialDocumentRepository } from '../application/interfaces/IFinancialDocumentRepository';

export class PrismaFinancialDocumentRepository implements IFinancialDocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<FinancialDocument | null> {
    const doc = await this.prisma.financialDocument.findUnique({
      where: { id },
    });

    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByBuildingId(buildingId: string): Promise<FinancialDocument[]> {
    const docs = await this.prisma.financialDocument.findMany({
      where: { buildingId },
      orderBy: { date: 'desc' },
    });

    return docs.map((d) => this.toDomain(d));
  }

  async create(document: FinancialDocument): Promise<FinancialDocument> {
    const created = await this.prisma.financialDocument.create({
      data: {
        id: document.id,
        buildingId: document.buildingId,
        category: document.category,
        date: document.date,
        amount: document.amount,
        description: document.description,
        documentPath: document.documentPath,
        includedInCharges: document.isIncludedInCharges,
        waterConsumption: document.waterConsumption,
      },
    });

    return this.toDomain(created);
  }

  async update(document: FinancialDocument): Promise<FinancialDocument> {
    const updated = await this.prisma.financialDocument.update({
      where: { id: document.id },
      data: {
        category: document.category,
        date: document.date,
        amount: document.amount,
        description: document.description,
        documentPath: document.documentPath,
        includedInCharges: document.isIncludedInCharges,
        waterConsumption: document.waterConsumption,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financialDocument.delete({
      where: { id },
    });
  }

  private toDomain(prismaDoc: any): FinancialDocument {
    return FinancialDocument.create({
      id: prismaDoc.id,
      buildingId: prismaDoc.buildingId,
      category: prismaDoc.category as DocumentCategory,
      date: prismaDoc.date,
      amount: prismaDoc.amount,
      description: prismaDoc.description,
      documentPath: prismaDoc.documentPath ?? undefined,
      includedInCharges: prismaDoc.includedInCharges,
      waterConsumption: prismaDoc.waterConsumption ?? undefined,
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt,
    });
  }
}
