import { describe, it, expect } from 'vitest';
import { LeaseRentOverride } from '../LeaseRentOverride';
import { Money } from '@/domain/value-objects/Money';

describe('LeaseRentOverride', () => {
  describe('create', () => {
    it('should create a valid rent override', () => {
      const rentAmount = Money.create(850);
      const chargesAmount = Money.create(70);

      const override = LeaseRentOverride.create({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2025-09',
        rentAmount,
        chargesAmount,
        reason: 'Correction historique',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(override.id).toBe('override-1');
      expect(override.leaseId).toBe('lease-1');
      expect(override.month).toBe('2025-09');
      expect(override.rentAmount.getValue()).toBe(850);
      expect(override.chargesAmount.getValue()).toBe(70);
      expect(override.reason).toBe('Correction historique');
    });

    it('should throw error if leaseId is empty', () => {
      expect(() =>
        LeaseRentOverride.create({
          id: 'override-1',
          leaseId: '',
          month: '2025-09',
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Lease ID is required');
    });

    it('should throw error if month format is invalid', () => {
      expect(() =>
        LeaseRentOverride.create({
          id: 'override-1',
          leaseId: 'lease-1',
          month: '2025/09', // wrong format
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Month must be in YYYY-MM format');
    });

    it('should throw error if month is empty', () => {
      expect(() =>
        LeaseRentOverride.create({
          id: 'override-1',
          leaseId: 'lease-1',
          month: '',
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Month is required');
    });

    it('should throw error if month has invalid year', () => {
      expect(() =>
        LeaseRentOverride.create({
          id: 'override-1',
          leaseId: 'lease-1',
          month: '25-09', // year too short
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Month must be in YYYY-MM format');
    });

    it('should throw error if month has invalid month number', () => {
      expect(() =>
        LeaseRentOverride.create({
          id: 'override-1',
          leaseId: 'lease-1',
          month: '2025-13', // month > 12
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Month must be in YYYY-MM format');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an override without validation', () => {
      const override = LeaseRentOverride.reconstitute({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2025-09',
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(override.id).toBe('override-1');
      expect(override.leaseId).toBe('lease-1');
      expect(override.month).toBe('2025-09');
    });
  });

  describe('totalAmount', () => {
    it('should return total rent including charges', () => {
      const override = LeaseRentOverride.create({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2025-09',
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const total = override.totalAmount();
      expect(total.getValue()).toBe(920);
    });
  });

  describe('update', () => {
    it('should update rent and charges amounts', () => {
      const override = LeaseRentOverride.create({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2025-09',
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = override.update({
        rentAmount: Money.create(900),
        chargesAmount: Money.create(80),
      });

      expect(updated.rentAmount.getValue()).toBe(900);
      expect(updated.chargesAmount.getValue()).toBe(80);
      expect(updated.month).toBe('2025-09'); // unchanged
      expect(updated.leaseId).toBe('lease-1'); // unchanged
    });

    it('should update reason', () => {
      const override = LeaseRentOverride.create({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2025-09',
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = override.update({
        reason: 'Nouvelle raison',
      });

      expect(updated.reason).toBe('Nouvelle raison');
    });
  });
});
