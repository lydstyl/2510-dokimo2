import { describe, it, expect } from 'vitest';
import { InsuranceCertificate } from '../InsuranceCertificate';

describe('InsuranceCertificate', () => {
  describe('create', () => {
    it('should create an insurance certificate with valid data', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-01');

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate,
        endDate,
        documentPath: '/uploads/insurance.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.id).toBe('cert-1');
      expect(cert.propertyId).toBe('property-1');
      expect(cert.startDate).toBe(startDate);
      expect(cert.endDate).toBe(endDate);
      expect(cert.documentPath).toBe('/uploads/insurance.pdf');
    });

    it('should create certificate without optional endDate and documentPath', () => {
      const startDate = new Date('2024-01-01');

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.endDate).toBeUndefined();
      expect(cert.documentPath).toBeUndefined();
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        InsuranceCertificate.create({
          id: '',
          propertyId: 'property-1',
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Insurance certificate id is required');
    });

    it('should throw error when propertyId is missing', () => {
      expect(() => {
        InsuranceCertificate.create({
          id: 'cert-1',
          propertyId: '',
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Property id is required');
    });

    it('should throw error when startDate is missing', () => {
      expect(() => {
        InsuranceCertificate.create({
          id: 'cert-1',
          propertyId: 'property-1',
          startDate: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Start date is required');
    });

    it('should throw error when endDate is before startDate', () => {
      expect(() => {
        InsuranceCertificate.create({
          id: 'cert-1',
          propertyId: 'property-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2023-12-31'),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('End date cannot be before start date');
    });
  });

  describe('isExpired', () => {
    it('should return false when endDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: new Date(),
        endDate: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.isExpired()).toBe(false);
    });

    it('should return true when endDate is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: new Date('2023-01-01'),
        endDate: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.isExpired()).toBe(true);
    });

    it('should return false when no endDate', () => {
      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.isExpired()).toBe(false);
    });
  });

  describe('isOlderThanOneYear', () => {
    it('should return false when startDate is less than one year old', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: sixMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.isOlderThanOneYear()).toBe(false);
    });

    it('should return true when startDate is more than one year old', () => {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: thirteenMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.isOlderThanOneYear()).toBe(true);
    });
  });

  describe('monthsSinceStart', () => {
    it('should return 0 for certificate starting today', () => {
      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.monthsSinceStart()).toBe(0);
    });

    it('should return correct number of months', () => {
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

      const cert = InsuranceCertificate.create({
        id: 'cert-1',
        propertyId: 'property-1',
        startDate: eightMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(cert.monthsSinceStart()).toBe(8);
    });
  });
});
