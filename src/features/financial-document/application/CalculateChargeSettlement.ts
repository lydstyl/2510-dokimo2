import { IFinancialDocumentRepository } from './interfaces/IFinancialDocumentRepository';
import { IPropertyChargeShareRepository } from './interfaces/IPropertyChargeShareRepository';
import { DocumentCategory, FinancialDocument } from '../domain/FinancialDocument';
import { WaterConsumptionCalculator, WaterReading } from '../domain/WaterConsumptionCalculator';

export interface ChargeSettlementInput {
  buildingId: string;
  propertyId: string;
  referenceDate?: Date; // Default to now
  waterReadings: WaterReading[]; // Water meter readings for this property
  provisionalChargesPaid: number; // Total provisional charges paid over 12 months
}

export interface CategoryChargeDetail {
  category: DocumentCategory;
  categoryLabel: string;
  documents: {
    id: string;
    date: Date;
    description: string;
    amount: number;
    documentPath?: string;
  }[];
  totalAmount: number;
  percentage: number; // 0-100
  propertyShare: number; // Amount this property must pay
  calculationMethod?: 'PERCENTAGE' | 'WATER_CONSUMPTION';
  waterDetails?: {
    propertyConsumption: number; // m³ per year
    buildingTotalConsumption: number; // m³ per year
    dynamicPercentage: number; // calculated percentage
    calculationMethod: 'ACTUAL' | 'EXTRAPOLATED';
    periodStart: Date;
    periodEnd: Date;
  };
}

export interface ChargeSettlementResult {
  propertyId: string;
  buildingId: string;
  referenceDate: Date;
  periodStart: Date; // 12 months ago
  periodEnd: Date; // reference date

  // Details by category
  categories: CategoryChargeDetail[];

  // Totals
  totalChargesActual: number; // Sum of all property shares
  totalChargesProvisional: number; // What was paid
  balance: number; // Negative = tenant owes, Positive = landlord owes

  // New monthly charges
  newMonthlyCharges: number; // totalChargesActual / 12

  // Warnings
  warnings: string[];
}

export class CalculateChargeSettlement {
  constructor(
    private financialDocumentRepository: IFinancialDocumentRepository,
    private chargeShareRepository: IPropertyChargeShareRepository
  ) {}

  async execute(input: ChargeSettlementInput): Promise<ChargeSettlementResult> {
    const referenceDate = input.referenceDate || new Date();
    const periodStart = new Date(referenceDate);
    periodStart.setMonth(periodStart.getMonth() - 12);

    const warnings: string[] = [];

    // 1. Get all financial documents for building in last 12 months (included in charges)
    const allDocuments = await this.financialDocumentRepository.findByBuildingId(input.buildingId);
    const includedDocuments = allDocuments.filter(
      (doc) => doc.isIncludedInCharges && doc.isWithinLast12Months(referenceDate)
    );

    // 2. Get charge shares for this property
    const chargeShares = await this.chargeShareRepository.findByPropertyId(input.propertyId);

    // 3. Group documents by category
    const documentsByCategory = this.groupDocumentsByCategory(includedDocuments);

    // 4. Calculate charges for each category
    const categories: CategoryChargeDetail[] = [];

    for (const [category, documents] of Object.entries(documentsByCategory)) {
      const docCategory = category as DocumentCategory;
      const totalAmount = documents.reduce((sum, doc) => sum + doc.amount, 0);

      if (docCategory === DocumentCategory.WATER) {
        // Special handling for water
        const waterDetail = await this.calculateWaterCharges(
          documents,
          input.waterReadings,
          totalAmount,
          referenceDate,
          warnings
        );
        categories.push(waterDetail);
      } else {
        // Standard percentage-based calculation
        const share = chargeShares.find((s) => s.category === docCategory);
        const percentage = share ? share.percentage : 0;

        if (percentage === 0 && totalAmount > 0) {
          warnings.push(
            `Aucun pourcentage configuré pour la catégorie "${this.getCategoryLabel(docCategory)}" mais des factures existent.`
          );
        }

        const propertyShare = (totalAmount * percentage) / 100;

        categories.push({
          category: docCategory,
          categoryLabel: this.getCategoryLabel(docCategory),
          documents: documents.map((doc) => ({
            id: doc.id,
            date: doc.date,
            description: doc.description,
            amount: doc.amount,
            documentPath: doc.documentPath,
          })),
          totalAmount,
          percentage,
          propertyShare,
          calculationMethod: 'PERCENTAGE',
        });
      }
    }

    // 5. Calculate totals
    const totalChargesActual = categories.reduce((sum, cat) => sum + cat.propertyShare, 0);
    const balance = input.provisionalChargesPaid - totalChargesActual;
    const newMonthlyCharges = totalChargesActual / 12;

    return {
      propertyId: input.propertyId,
      buildingId: input.buildingId,
      referenceDate,
      periodStart,
      periodEnd: referenceDate,
      categories,
      totalChargesActual,
      totalChargesProvisional: input.provisionalChargesPaid,
      balance,
      newMonthlyCharges,
      warnings,
    };
  }

  private groupDocumentsByCategory(
    documents: FinancialDocument[]
  ): Record<string, FinancialDocument[]> {
    const grouped: Record<string, FinancialDocument[]> = {};

    for (const doc of documents) {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc);
    }

    return grouped;
  }

  private async calculateWaterCharges(
    waterDocuments: FinancialDocument[],
    propertyWaterReadings: WaterReading[],
    totalWaterAmount: number,
    referenceDate: Date,
    warnings: string[]
  ): Promise<CategoryChargeDetail> {
    // Calculate property's annual water consumption
    const consumptionResult = WaterConsumptionCalculator.calculateAnnualConsumption(
      propertyWaterReadings
    );

    if (!consumptionResult) {
      warnings.push(
        "Impossible de calculer la consommation d'eau : pas assez de relevés. Aucune charge d'eau appliquée."
      );
      return {
        category: DocumentCategory.WATER,
        categoryLabel: this.getCategoryLabel(DocumentCategory.WATER),
        documents: waterDocuments.map((doc) => ({
          id: doc.id,
          date: doc.date,
          description: doc.description,
          amount: doc.amount,
          documentPath: doc.documentPath,
        })),
        totalAmount: totalWaterAmount,
        percentage: 0,
        propertyShare: 0,
        calculationMethod: 'WATER_CONSUMPTION',
      };
    }

    // Calculate building's total water consumption from documents
    const buildingTotalConsumption = waterDocuments.reduce((sum, doc) => {
      return sum + (doc.waterConsumption || 0);
    }, 0);

    if (buildingTotalConsumption === 0) {
      warnings.push(
        "Les factures d'eau n'ont pas de consommation (m³) renseignée. Impossible de calculer les charges d'eau."
      );
      return {
        category: DocumentCategory.WATER,
        categoryLabel: this.getCategoryLabel(DocumentCategory.WATER),
        documents: waterDocuments.map((doc) => ({
          id: doc.id,
          date: doc.date,
          description: doc.description,
          amount: doc.amount,
          documentPath: doc.documentPath,
        })),
        totalAmount: totalWaterAmount,
        percentage: 0,
        propertyShare: 0,
        calculationMethod: 'WATER_CONSUMPTION',
      };
    }

    // Calculate dynamic percentage
    const dynamicPercentage = (consumptionResult.annualConsumption / buildingTotalConsumption) * 100;
    const propertyShare = (totalWaterAmount * dynamicPercentage) / 100;

    return {
      category: DocumentCategory.WATER,
      categoryLabel: this.getCategoryLabel(DocumentCategory.WATER),
      documents: waterDocuments.map((doc) => ({
        id: doc.id,
        date: doc.date,
        description: doc.description,
        amount: doc.amount,
        documentPath: doc.documentPath,
      })),
      totalAmount: totalWaterAmount,
      percentage: dynamicPercentage,
      propertyShare,
      calculationMethod: 'WATER_CONSUMPTION',
      waterDetails: {
        propertyConsumption: consumptionResult.annualConsumption,
        buildingTotalConsumption,
        dynamicPercentage,
        calculationMethod: consumptionResult.calculationMethod,
        periodStart: consumptionResult.periodStart,
        periodEnd: consumptionResult.periodEnd,
      },
    };
  }

  private getCategoryLabel(category: DocumentCategory): string {
    const labels: Record<DocumentCategory, string> = {
      [DocumentCategory.ELECTRICITY]: 'Électricité',
      [DocumentCategory.WATER]: 'Eau',
      [DocumentCategory.CLEANING]: 'Ménage',
      [DocumentCategory.GARBAGE_TAX]: 'Taxe ordures ménagères',
      [DocumentCategory.HEATING]: 'Chauffage',
      [DocumentCategory.ELEVATOR]: 'Ascenseur',
      [DocumentCategory.COMMON_AREA_MAINTENANCE]: 'Entretien espaces communs',
      [DocumentCategory.PROPERTY_TAX]: 'Taxe foncière',
      [DocumentCategory.RENOVATION_WORK]: 'Travaux de rénovation',
      [DocumentCategory.REPAIR_WORK]: 'Travaux de réparation',
      [DocumentCategory.INSURANCE]: 'Assurance',
      [DocumentCategory.OTHER]: 'Autre',
    };
    return labels[category] || category;
  }
}
