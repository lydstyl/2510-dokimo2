import { describe, it, expect } from 'vitest';
import { FinancialDocument, DocumentCategory } from '../FinancialDocument';

describe('FinancialDocument', () => {
  describe('create', () => {
    it('should create a valid financial document', () => {
      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.ELECTRICITY,
        date: new Date('2024-01-15'),
        amount: 150.50,
        description: 'Facture électricité janvier 2024',
        includedInCharges: true,
        documentPath: '/uploads/bill.pdf',
        waterConsumption: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.id).toBe('1');
      expect(doc.buildingId).toBe('building-1');
      expect(doc.category).toBe(DocumentCategory.ELECTRICITY);
      expect(doc.amount).toBe(150.50);
      expect(doc.isIncludedInCharges).toBe(true);
    });

    it('should create water bill with consumption', () => {
      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.WATER,
        date: new Date('2024-01-15'),
        amount: 200,
        description: 'Facture eau',
        includedInCharges: true,
        waterConsumption: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.waterConsumption).toBe(50);
    });

    it('should throw error if amount is negative', () => {
      expect(() =>
        FinancialDocument.create({
          id: '1',
          buildingId: 'building-1',
          category: DocumentCategory.ELECTRICITY,
          date: new Date(),
          amount: -100,
          description: 'Test',
          includedInCharges: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Financial document amount cannot be negative');
    });

    it('should throw error if description is empty', () => {
      expect(() =>
        FinancialDocument.create({
          id: '1',
          buildingId: 'building-1',
          category: DocumentCategory.ELECTRICITY,
          date: new Date(),
          amount: 100,
          description: '',
          includedInCharges: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Financial document description cannot be empty');
    });

    it('should throw error if date is in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() =>
        FinancialDocument.create({
          id: '1',
          buildingId: 'building-1',
          category: DocumentCategory.ELECTRICITY,
          date: futureDate,
          amount: 100,
          description: 'Test',
          includedInCharges: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Financial document date cannot be in the future');
    });

    it('should throw error if water consumption is negative', () => {
      expect(() =>
        FinancialDocument.create({
          id: '1',
          buildingId: 'building-1',
          category: DocumentCategory.WATER,
          date: new Date(),
          amount: 100,
          description: 'Facture eau',
          includedInCharges: true,
          waterConsumption: -10,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Water consumption cannot be negative');
    });
  });

  describe('isWaterBill', () => {
    it('should return true for water category', () => {
      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.WATER,
        date: new Date(),
        amount: 100,
        description: 'Water bill',
        includedInCharges: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.isWaterBill()).toBe(true);
    });

    it('should return false for non-water category', () => {
      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.ELECTRICITY,
        date: new Date(),
        amount: 100,
        description: 'Electricity bill',
        includedInCharges: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.isWaterBill()).toBe(false);
    });
  });

  describe('isWithinLast12Months', () => {
    it('should return true for document within last 12 months', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.ELECTRICITY,
        date: sixMonthsAgo,
        amount: 100,
        description: 'Test',
        includedInCharges: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.isWithinLast12Months()).toBe(true);
    });

    it('should return false for document older than 12 months', () => {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      const doc = FinancialDocument.create({
        id: '1',
        buildingId: 'building-1',
        category: DocumentCategory.ELECTRICITY,
        date: thirteenMonthsAgo,
        amount: 100,
        description: 'Test',
        includedInCharges: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.isWithinLast12Months()).toBe(false);
    });
  });
});
