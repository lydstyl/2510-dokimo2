import { describe, it, expect } from 'vitest';
import { Lease } from '../Lease';
import { Money } from '../../value-objects/Money';

describe('Lease', () => {
  const validLeaseProps = {
    id: '1',
    propertyId: 'prop-1',
    tenantIds: ['tenant-1'],
    startDate: new Date('2024-01-01'),
    rentAmount: Money.create(1000),
    chargesAmount: Money.create(100),
    paymentDueDay: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a valid Lease', () => {
      const lease = Lease.create(validLeaseProps);
      expect(lease.id).toBe('1');
      expect(lease.propertyId).toBe('prop-1');
      expect(lease.tenantIds).toEqual(['tenant-1']);
      expect(lease.rentAmount.getValue()).toBe(1000);
      expect(lease.chargesAmount.getValue()).toBe(100);
      expect(lease.paymentDueDay).toBe(5);
    });

    it('should throw error for invalid payment due day', () => {
      expect(() =>
        Lease.create({ ...validLeaseProps, paymentDueDay: 0 })
      ).toThrow('Payment due day must be between 1 and 31');

      expect(() =>
        Lease.create({ ...validLeaseProps, paymentDueDay: 32 })
      ).toThrow('Payment due day must be between 1 and 31');
    });

    it('should throw error if end date is before start date', () => {
      expect(() =>
        Lease.create({
          ...validLeaseProps,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-01-01'),
        })
      ).toThrow('End date must be after start date');
    });
  });

  describe('totalAmount', () => {
    it('should calculate total amount correctly', () => {
      const lease = Lease.create(validLeaseProps);
      expect(lease.totalAmount.getValue()).toBe(1100);
    });
  });

  describe('isActive', () => {
    it('should return true for active lease', () => {
      const lease = Lease.create({
        ...validLeaseProps,
        startDate: new Date('2024-01-01'),
      });
      const testDate = new Date('2024-06-15');
      expect(lease.isActive(testDate)).toBe(true);
    });

    it('should return false before start date', () => {
      const lease = Lease.create({
        ...validLeaseProps,
        startDate: new Date('2024-06-01'),
      });
      const testDate = new Date('2024-05-01');
      expect(lease.isActive(testDate)).toBe(false);
    });

    it('should return false after end date', () => {
      const lease = Lease.create({
        ...validLeaseProps,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      const testDate = new Date('2025-01-01');
      expect(lease.isActive(testDate)).toBe(false);
    });
  });

  describe('getExpectedPaymentDate', () => {
    it('should return correct payment date for given month', () => {
      const lease = Lease.create(validLeaseProps);
      const month = new Date('2024-03-15');
      const expectedDate = lease.getExpectedPaymentDate(month);
      expect(expectedDate.getDate()).toBe(5);
      expect(expectedDate.getMonth()).toBe(2); // March (0-indexed)
      expect(expectedDate.getFullYear()).toBe(2024);
    });
  });
});
