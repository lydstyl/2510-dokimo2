import { describe, it, expect } from 'vitest';
import { WaterMeterReading } from '../WaterMeterReading';

describe('WaterMeterReading', () => {
  describe('create', () => {
    it('should create a water meter reading with valid data', () => {
      const readingDate = new Date('2024-01-15');
      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate,
        meterReading: 1234.5,
        documentPath: '/uploads/water-meter.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.id).toBe('reading-1');
      expect(reading.propertyId).toBe('property-1');
      expect(reading.readingDate).toBe(readingDate);
      expect(reading.meterReading).toBe(1234.5);
      expect(reading.documentPath).toBe('/uploads/water-meter.jpg');
    });

    it('should create reading without optional documentPath', () => {
      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate: new Date(),
        meterReading: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.documentPath).toBeUndefined();
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        WaterMeterReading.create({
          id: '',
          propertyId: 'property-1',
          readingDate: new Date(),
          meterReading: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Water meter reading id is required');
    });

    it('should throw error when propertyId is missing', () => {
      expect(() => {
        WaterMeterReading.create({
          id: 'reading-1',
          propertyId: '',
          readingDate: new Date(),
          meterReading: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Property id is required');
    });

    it('should throw error when readingDate is missing', () => {
      expect(() => {
        WaterMeterReading.create({
          id: 'reading-1',
          propertyId: 'property-1',
          readingDate: null as any,
          meterReading: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Reading date is required');
    });

    it('should throw error when meterReading is negative', () => {
      expect(() => {
        WaterMeterReading.create({
          id: 'reading-1',
          propertyId: 'property-1',
          readingDate: new Date(),
          meterReading: -10,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Meter reading cannot be negative');
    });

    it('should throw error when readingDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      expect(() => {
        WaterMeterReading.create({
          id: 'reading-1',
          propertyId: 'property-1',
          readingDate: futureDate,
          meterReading: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Reading date cannot be in the future');
    });
  });

  describe('isOlderThanOneYear', () => {
    it('should return false when reading is less than one year old', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate: sixMonthsAgo,
        meterReading: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.isOlderThanOneYear()).toBe(false);
    });

    it('should return true when reading is more than one year old', () => {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate: thirteenMonthsAgo,
        meterReading: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.isOlderThanOneYear()).toBe(true);
    });
  });

  describe('monthsSinceReading', () => {
    it('should return 0 for reading done today', () => {
      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate: new Date(),
        meterReading: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.monthsSinceReading()).toBe(0);
    });

    it('should return correct number of months', () => {
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

      const reading = WaterMeterReading.create({
        id: 'reading-1',
        propertyId: 'property-1',
        readingDate: eightMonthsAgo,
        meterReading: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(reading.monthsSinceReading()).toBe(8);
    });
  });
});
