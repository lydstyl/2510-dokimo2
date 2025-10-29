import { describe, it, expect } from 'vitest';
import { BoilerMaintenance } from '../BoilerMaintenance';

describe('BoilerMaintenance', () => {
  describe('create', () => {
    it('should create a maintenance record with valid data', () => {
      const maintenanceDate = new Date('2024-01-15');
      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate,
        documentPath: '/uploads/invoice-2024-01.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.id).toBe('maint-1');
      expect(maintenance.boilerId).toBe('boiler-1');
      expect(maintenance.maintenanceDate).toBe(maintenanceDate);
      expect(maintenance.documentPath).toBe('/uploads/invoice-2024-01.pdf');
    });

    it('should create a maintenance record without optional documentPath', () => {
      const maintenanceDate = new Date('2024-01-15');
      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.id).toBe('maint-1');
      expect(maintenance.documentPath).toBeUndefined();
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        BoilerMaintenance.create({
          id: '',
          boilerId: 'boiler-1',
          maintenanceDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Maintenance id is required');
    });

    it('should throw error when boilerId is missing', () => {
      expect(() => {
        BoilerMaintenance.create({
          id: 'maint-1',
          boilerId: '',
          maintenanceDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Boiler id is required');
    });

    it('should throw error when maintenanceDate is missing', () => {
      expect(() => {
        BoilerMaintenance.create({
          id: 'maint-1',
          boilerId: 'boiler-1',
          maintenanceDate: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Maintenance date is required');
    });

    it('should throw error when maintenanceDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      expect(() => {
        BoilerMaintenance.create({
          id: 'maint-1',
          boilerId: 'boiler-1',
          maintenanceDate: futureDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Maintenance date cannot be in the future');
    });
  });

  describe('isOverdue', () => {
    it('should return false when maintenance is less than 11 months old', () => {
      const tenMonthsAgo = new Date();
      tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: tenMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.isOverdue()).toBe(false);
    });

    it('should return true when maintenance is exactly 11 months old', () => {
      const elevenMonthsAgo = new Date();
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);

      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: elevenMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.isOverdue()).toBe(true);
    });

    it('should return true when maintenance is more than 11 months old', () => {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: thirteenMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.isOverdue()).toBe(true);
    });
  });

  describe('monthsSinceLastMaintenance', () => {
    it('should return 0 for maintenance done today', () => {
      const today = new Date();
      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: today,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.monthsSinceLastMaintenance()).toBe(0);
    });

    it('should return correct number of months', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: sixMonthsAgo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(maintenance.monthsSinceLastMaintenance()).toBe(6);
    });
  });

  describe('nextMaintenanceDate', () => {
    it('should return date one year after last maintenance', () => {
      const lastMaintenance = new Date('2024-01-15');
      const maintenance = BoilerMaintenance.create({
        id: 'maint-1',
        boilerId: 'boiler-1',
        maintenanceDate: lastMaintenance,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const nextDate = maintenance.nextMaintenanceDate();
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(15);
    });
  });
});
