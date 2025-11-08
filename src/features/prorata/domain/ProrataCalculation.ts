import { Money } from '@/domain/value-objects/Money'

export type CalculationType = 'MOVE_IN' | 'MOVE_OUT'

export interface ProrataCalculationProps {
  monthlyRent: Money
  startDate: Date
  endDate: Date
  daysInMonth: number
  calculationType: CalculationType
}

export class ProrataCalculation {
  private constructor(
    public readonly monthlyRent: Money,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly daysInMonth: number,
    public readonly calculationType: CalculationType,
    public readonly daysOccupied: number
  ) {}

  static create(props: ProrataCalculationProps): ProrataCalculation {
    // Validate dates
    if (props.startDate > props.endDate) {
      throw new Error('Start date must be before or equal to end date')
    }

    // Validate days in month
    if (props.daysInMonth < 28 || props.daysInMonth > 31) {
      throw new Error('Days in month must be between 28 and 31')
    }

    // Calculate days occupied (inclusive of both start and end dates)
    const daysOccupied = this.calculateDaysOccupied(
      props.startDate,
      props.endDate
    )

    return new ProrataCalculation(
      props.monthlyRent,
      props.startDate,
      props.endDate,
      props.daysInMonth,
      props.calculationType,
      daysOccupied
    )
  }

  private static calculateDaysOccupied(startDate: Date, endDate: Date): number {
    // Use UTC to avoid timezone issues
    const start = Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    )
    const end = Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    )

    const diffTime = end - start
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    // Add 1 to include both start and end dates
    return diffDays + 1
  }

  /**
   * Calculate the prorated rent amount based on days occupied
   */
  calculateProrataAmount(): Money {
    const dailyRate = this.monthlyRent.getAmount() / this.daysInMonth
    const prorataAmount = dailyRate * this.daysOccupied

    // Round to 2 decimal places
    return Money.create(Math.round(prorataAmount * 100) / 100)
  }

  /**
   * Get the percentage of the month occupied
   */
  getProrataPercentage(): number {
    const percentage = (this.daysOccupied / this.daysInMonth) * 100
    return Math.round(percentage * 100) / 100 // Round to 2 decimals
  }

  /**
   * Get the daily rate for this rental
   */
  getDailyRate(): Money {
    const dailyRate = this.monthlyRent.getAmount() / this.daysInMonth
    return Money.create(Math.round(dailyRate * 100) / 100)
  }

  /**
   * Get a summary of the calculation
   */
  getSummary(): {
    monthlyRent: number
    dailyRate: number
    daysOccupied: number
    daysInMonth: number
    percentage: number
    prorataAmount: number
    calculationType: CalculationType
  } {
    return {
      monthlyRent: this.monthlyRent.getAmount(),
      dailyRate: this.getDailyRate().getAmount(),
      daysOccupied: this.daysOccupied,
      daysInMonth: this.daysInMonth,
      percentage: this.getProrataPercentage(),
      prorataAmount: this.calculateProrataAmount().getAmount(),
      calculationType: this.calculationType
    }
  }
}
