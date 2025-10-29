/**
 * Water Consumption Calculator
 *
 * Calculates annual water consumption for a tenant based on water meter readings.
 * Prefers readings spaced at least 1 year apart. If not available, extrapolates
 * from the two most recent readings.
 */

export interface WaterReading {
  readingDate: Date;
  meterReading: number; // in m³
}

export interface WaterConsumptionResult {
  annualConsumption: number; // in m³ per year
  calculationMethod: 'ACTUAL' | 'EXTRAPOLATED';
  periodStart: Date;
  periodEnd: Date;
  daysBetweenReadings: number;
}

export class WaterConsumptionCalculator {
  /**
   * Calculate annual water consumption from readings
   * @param readings - Array of water meter readings, should be sorted by date (newest first)
   */
  static calculateAnnualConsumption(readings: WaterReading[]): WaterConsumptionResult | null {
    if (readings.length < 2) {
      return null; // Need at least 2 readings to calculate consumption
    }

    // Sort readings by date (newest first)
    const sortedReadings = [...readings].sort(
      (a, b) => b.readingDate.getTime() - a.readingDate.getTime()
    );

    // Try to find readings spaced at least 1 year apart (365 days)
    const oneYearPair = this.findReadingsSpacedByYear(sortedReadings);

    if (oneYearPair) {
      const { newer, older } = oneYearPair;
      const consumption = newer.meterReading - older.meterReading;
      const days = this.daysBetween(older.readingDate, newer.readingDate);

      return {
        annualConsumption: consumption,
        calculationMethod: 'ACTUAL',
        periodStart: older.readingDate,
        periodEnd: newer.readingDate,
        daysBetweenReadings: days,
      };
    }

    // No readings spaced by a year, extrapolate from 2 most recent
    return this.extrapolateAnnualConsumption(sortedReadings[0], sortedReadings[1]);
  }

  /**
   * Find two readings spaced at least 365 days apart
   * Prioritizes consecutive readings that are ~1 year apart
   */
  private static findReadingsSpacedByYear(
    readings: WaterReading[]
  ): { newer: WaterReading; older: WaterReading } | null {
    // First, look for consecutive readings (i, i+1) that are >= 365 days apart
    for (let i = 0; i < readings.length - 1; i++) {
      const newer = readings[i];
      const older = readings[i + 1];
      const days = this.daysBetween(older.readingDate, newer.readingDate);
      if (days >= 365) {
        return { newer, older };
      }
    }

    // If no consecutive pair found, look for any pair >= 365 days apart
    for (let i = 0; i < readings.length - 1; i++) {
      for (let j = i + 1; j < readings.length; j++) {
        const days = this.daysBetween(readings[j].readingDate, readings[i].readingDate);
        if (days >= 365) {
          return { newer: readings[i], older: readings[j] };
        }
      }
    }
    return null;
  }

  /**
   * Extrapolate annual consumption from two readings
   */
  private static extrapolateAnnualConsumption(
    newer: WaterReading,
    older: WaterReading
  ): WaterConsumptionResult {
    const consumption = newer.meterReading - older.meterReading;
    const days = this.daysBetween(older.readingDate, newer.readingDate);

    if (days === 0) {
      throw new Error('Cannot calculate consumption: readings have same date');
    }

    // Extrapolate to 365 days
    const annualConsumption = (consumption / days) * 365;

    return {
      annualConsumption: Math.round(annualConsumption * 100) / 100, // round to 2 decimals
      calculationMethod: 'EXTRAPOLATED',
      periodStart: older.readingDate,
      periodEnd: newer.readingDate,
      daysBetweenReadings: days,
    };
  }

  /**
   * Calculate days between two dates
   */
  private static daysBetween(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
