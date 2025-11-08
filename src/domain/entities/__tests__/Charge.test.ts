import { describe, it, expect } from 'vitest';
import { Charge } from '../Charge';
import { Money } from '../../value-objects/Money';

describe('Charge', () => {
  describe('create', () => {
    it('should create a charge with valid properties', () => {
      const charge = Charge.create({
        id: '1',
        leaseId: 'lease-1',
        amount: Money.create(500),
        chargeDate: new Date('2025-01-15'),
        description: 'Dépôt de garantie',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(charge.id).toBe('1');
      expect(charge.leaseId).toBe('lease-1');
      expect(charge.amount.getAmount()).toBe(500);
      expect(charge.chargeDate.toISOString()).toBe(new Date('2025-01-15').toISOString());
      expect(charge.description).toBe('Dépôt de garantie');
    });

    it('should create a charge without description (optional)', () => {
      const charge = Charge.create({
        id: '2',
        leaseId: 'lease-2',
        amount: Money.create(100),
        chargeDate: new Date('2025-02-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(charge.description).toBeUndefined();
    });

    it('should throw error when amount is not a Money instance', () => {
      expect(() => {
        Charge.create({
          id: '3',
          leaseId: 'lease-3',
          amount: 100 as any, // Invalid: should be Money
          chargeDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Amount must be a Money instance');
    });

    it('should throw error when chargeDate is invalid', () => {
      expect(() => {
        Charge.create({
          id: '4',
          leaseId: 'lease-4',
          amount: Money.create(100),
          chargeDate: new Date('invalid-date'),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Invalid charge date');
    });
  });

  describe('getters', () => {
    it('should expose all properties via getters', () => {
      const now = new Date();
      const chargeDate = new Date('2025-03-10');
      const amount = Money.create(250);

      const charge = Charge.create({
        id: '6',
        leaseId: 'lease-6',
        amount,
        chargeDate,
        description: 'Achat meuble',
        createdAt: now,
        updatedAt: now,
      });

      expect(charge.id).toBe('6');
      expect(charge.leaseId).toBe('lease-6');
      expect(charge.amount).toBe(amount);
      expect(charge.chargeDate).toBe(chargeDate);
      expect(charge.description).toBe('Achat meuble');
      expect(charge.createdAt).toBe(now);
      expect(charge.updatedAt).toBe(now);
    });
  });
});
