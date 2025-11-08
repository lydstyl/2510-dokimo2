import { Money } from '@/domain/value-objects/Money'
import {
  ProrataCalculation,
  CalculationType,
} from '../domain/ProrataCalculation'

export interface CalculateProrataInput {
  monthlyRent: number
  startDate: string // ISO date string
  endDate: string // ISO date string
  calculationType: CalculationType
}

export interface CalculateProrataOutput {
  monthlyRent: number
  dailyRate: number
  daysOccupied: number
  daysInMonth: number
  percentage: number
  prorataAmount: number
  calculationType: CalculationType
  startDate: string
  endDate: string
}

export class CalculateProrata {
  execute(input: CalculateProrataInput): CalculateProrataOutput {
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)

    // Validate that dates are in the same month
    if (
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear()
    ) {
      throw new Error('Start and end dates must be in the same month')
    }

    // Get days in month
    const daysInMonth = this.getDaysInMonth(
      startDate.getFullYear(),
      startDate.getMonth()
    )

    // Create Money value object
    const monthlyRent = Money.create(input.monthlyRent)

    // Create ProrataCalculation domain entity
    const prorata = ProrataCalculation.create({
      monthlyRent,
      startDate,
      endDate,
      daysInMonth,
      calculationType: input.calculationType,
    })

    // Get summary from domain entity
    const summary = prorata.getSummary()

    return {
      ...summary,
      startDate: input.startDate,
      endDate: input.endDate,
    }
  }

  private getDaysInMonth(year: number, month: number): number {
    // month is 0-indexed (0 = January, 11 = December)
    // Setting day to 0 of next month gives last day of current month
    return new Date(year, month + 1, 0).getDate()
  }
}
