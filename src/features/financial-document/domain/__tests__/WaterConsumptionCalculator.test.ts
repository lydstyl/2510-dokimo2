import { describe, it, expect } from 'vitest';
import { WaterConsumptionCalculator } from '../WaterConsumptionCalculator';

describe('WaterConsumptionCalculator', () => {
  describe('calculateAnnualConsumption', () => {
    it('should return null if less than 2 readings', () => {
      const result = WaterConsumptionCalculator.calculateAnnualConsumption([
        { readingDate: new Date('2024-01-01'), meterReading: 100 },
      ]);

      expect(result).toBeNull();
    });

    it('should use actual consumption when readings are 1 year apart', () => {
      const readings = [
        { readingDate: new Date('2024-01-01'), meterReading: 120 }, // newer
        { readingDate: new Date('2023-01-01'), meterReading: 100 }, // older
      ];

      const result = WaterConsumptionCalculator.calculateAnnualConsumption(readings);

      expect(result).not.toBeNull();
      expect(result!.annualConsumption).toBe(20);
      expect(result!.calculationMethod).toBe('ACTUAL');
      expect(result!.daysBetweenReadings).toBeGreaterThanOrEqual(365);
    });

    it('should extrapolate when readings are less than 1 year apart', () => {
      const readings = [
        { readingDate: new Date('2024-07-01'), meterReading: 110 }, // 6 months later
        { readingDate: new Date('2024-01-01'), meterReading: 100 }, // 10 m³ in ~180 days
      ];

      const result = WaterConsumptionCalculator.calculateAnnualConsumption(readings);

      expect(result).not.toBeNull();
      expect(result!.calculationMethod).toBe('EXTRAPOLATED');
      // 10 m³ in ~180 days should extrapolate to ~20 m³ per year
      expect(result!.annualConsumption).toBeGreaterThan(18);
      expect(result!.annualConsumption).toBeLessThan(22);
    });

    it('should handle unsorted readings', () => {
      const readings = [
        { readingDate: new Date('2023-01-01'), meterReading: 100 }, // older (will be sorted)
        { readingDate: new Date('2024-01-01'), meterReading: 125 }, // newer
      ];

      const result = WaterConsumptionCalculator.calculateAnnualConsumption(readings);

      expect(result).not.toBeNull();
      expect(result!.annualConsumption).toBe(25);
    });

    it('should prefer readings with 1 year gap over more recent ones', () => {
      const readings = [
        { readingDate: new Date('2024-06-01'), meterReading: 130 }, // most recent, 6 months
        { readingDate: new Date('2024-01-01'), meterReading: 120 }, // 1 year from older
        { readingDate: new Date('2023-01-01'), meterReading: 100 }, // 1 year old
      ];

      const result = WaterConsumptionCalculator.calculateAnnualConsumption(readings);

      expect(result).not.toBeNull();
      expect(result!.calculationMethod).toBe('ACTUAL');
      // Should use the pair with ~365 days: 120 - 100 = 20 m³
      expect(result!.annualConsumption).toBe(20);
    });

    it('should throw error if readings have same date', () => {
      const readings = [
        { readingDate: new Date('2024-01-01'), meterReading: 100 },
        { readingDate: new Date('2024-01-01'), meterReading: 110 },
      ];

      expect(() =>
        WaterConsumptionCalculator.calculateAnnualConsumption(readings)
      ).toThrow('Cannot calculate consumption: readings have same date');
    });

    it('should handle leap year correctly', () => {
      const readings = [
        { readingDate: new Date('2024-02-29'), meterReading: 120 }, // leap year
        { readingDate: new Date('2023-02-28'), meterReading: 100 },
      ];

      const result = WaterConsumptionCalculator.calculateAnnualConsumption(readings);

      expect(result).not.toBeNull();
      expect(result!.calculationMethod).toBe('ACTUAL');
      expect(result!.daysBetweenReadings).toBe(366); // leap year
    });
  });
});
