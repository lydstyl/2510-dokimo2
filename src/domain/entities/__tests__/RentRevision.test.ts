import { describe, it, expect } from 'vitest';
import { RentRevision } from '../RentRevision';
import { Money } from '../../value-objects/Money';

describe('RentRevision', () => {
  describe('create', () => {
    it('should create a valid rent revision', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-01-01'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(150),
        reason: 'IRL_REVISION',
        createdAt: new Date(),
      });

      expect(revision.id).toBe('test-id');
      expect(revision.leaseId).toBe('lease-123');
      expect(revision.rentAmount.getValue()).toBe(1000);
      expect(revision.chargesAmount.getValue()).toBe(150);
      expect(revision.totalAmount.getValue()).toBe(1150);
    });

    it('should create revision without reason', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-01-01'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(150),
        createdAt: new Date(),
      });

      expect(revision.reason).toBeUndefined();
    });

    it('should throw error for negative rent amount', () => {
      expect(() => {
        RentRevision.create({
          id: 'test-id',
          leaseId: 'lease-123',
          effectiveDate: new Date('2024-01-01'),
          rentAmount: Money.create(-100),
          chargesAmount: Money.create(150),
          createdAt: new Date(),
        });
      }).toThrow('Money amount cannot be negative');
    });

    it('should throw error for negative charges amount', () => {
      expect(() => {
        RentRevision.create({
          id: 'test-id',
          leaseId: 'lease-123',
          effectiveDate: new Date('2024-01-01'),
          rentAmount: Money.create(1000),
          chargesAmount: Money.create(-50),
          createdAt: new Date(),
        });
      }).toThrow('Money amount cannot be negative');
    });
  });

  describe('isEffectiveForMonth', () => {
    it('should return true if effective date is before or at month start', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-01-15'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(150),
        createdAt: new Date(),
      });

      const monthDate = new Date('2024-02-01');
      expect(revision.isEffectiveForMonth(monthDate)).toBe(true);
    });

    it('should return false if effective date is after month start', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-03-15'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(150),
        createdAt: new Date(),
      });

      const monthDate = new Date('2024-02-01');
      expect(revision.isEffectiveForMonth(monthDate)).toBe(false);
    });

    it('should return true if effective date is same as month start', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-02-01'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(150),
        createdAt: new Date(),
      });

      const monthDate = new Date('2024-02-01');
      expect(revision.isEffectiveForMonth(monthDate)).toBe(true);
    });
  });

  describe('totalAmount', () => {
    it('should calculate total rent including charges', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-01-01'),
        rentAmount: Money.create(1200),
        chargesAmount: Money.create(180),
        createdAt: new Date(),
      });

      expect(revision.totalAmount.getValue()).toBe(1380);
    });

    it('should handle zero charges', () => {
      const revision = RentRevision.create({
        id: 'test-id',
        leaseId: 'lease-123',
        effectiveDate: new Date('2024-01-01'),
        rentAmount: Money.create(1000),
        chargesAmount: Money.create(0),
        createdAt: new Date(),
      });

      expect(revision.totalAmount.getValue()).toBe(1000);
    });
  });
});
