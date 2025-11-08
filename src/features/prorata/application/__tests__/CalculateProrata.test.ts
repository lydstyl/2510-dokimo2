import { describe, it, expect } from 'vitest'
import { CalculateProrata } from '../CalculateProrata'
import { Money } from '@/domain/value-objects/Money'

describe('CalculateProrata', () => {
  const useCase = new CalculateProrata()

  describe('execute', () => {
    it('should calculate prorata for incoming tenant', () => {
      const result = useCase.execute({
        monthlyRent: 1000,
        startDate: '2025-01-15',
        endDate: '2025-01-31',
        calculationType: 'MOVE_IN',
      })

      expect(result.monthlyRent).toBe(1000)
      expect(result.daysOccupied).toBe(17)
      expect(result.daysInMonth).toBe(31)
      expect(result.dailyRate).toBeCloseTo(32.26, 2)
      expect(result.prorataAmount).toBeCloseTo(548.39, 2)
      expect(result.percentage).toBeCloseTo(54.84, 2)
      expect(result.calculationType).toBe('MOVE_IN')
    })

    it('should calculate prorata for outgoing tenant', () => {
      const result = useCase.execute({
        monthlyRent: 1500,
        startDate: '2025-02-01',
        endDate: '2025-02-10',
        calculationType: 'MOVE_OUT',
      })

      expect(result.monthlyRent).toBe(1500)
      expect(result.daysOccupied).toBe(10)
      expect(result.daysInMonth).toBe(28)
      expect(result.dailyRate).toBeCloseTo(53.57, 2)
      expect(result.prorataAmount).toBeCloseTo(535.71, 2)
      expect(result.percentage).toBeCloseTo(35.71, 2)
      expect(result.calculationType).toBe('MOVE_OUT')
    })

    it('should handle full month calculation', () => {
      const result = useCase.execute({
        monthlyRent: 1200,
        startDate: '2025-03-01',
        endDate: '2025-03-31',
        calculationType: 'MOVE_IN',
      })

      expect(result.daysOccupied).toBe(31)
      expect(result.prorataAmount).toBe(1200)
      expect(result.percentage).toBe(100)
    })

    it('should handle February in non-leap year', () => {
      const result = useCase.execute({
        monthlyRent: 2800,
        startDate: '2025-02-15',
        endDate: '2025-02-28',
        calculationType: 'MOVE_IN',
      })

      expect(result.daysInMonth).toBe(28)
      expect(result.daysOccupied).toBe(14)
      expect(result.percentage).toBe(50)
      expect(result.prorataAmount).toBe(1400)
    })

    it('should handle February in leap year', () => {
      const result = useCase.execute({
        monthlyRent: 2900,
        startDate: '2024-02-15',
        endDate: '2024-02-29',
        calculationType: 'MOVE_IN',
      })

      expect(result.daysInMonth).toBe(29)
      expect(result.daysOccupied).toBe(15)
      expect(result.percentage).toBeCloseTo(51.72, 2)
    })

    it('should throw error for invalid date range', () => {
      expect(() =>
        useCase.execute({
          monthlyRent: 1000,
          startDate: '2025-01-31',
          endDate: '2025-01-01',
          calculationType: 'MOVE_IN',
        })
      ).toThrow('Start date must be before or equal to end date')
    })

    it('should throw error for negative monthly rent', () => {
      expect(() =>
        useCase.execute({
          monthlyRent: -1000,
          startDate: '2025-01-15',
          endDate: '2025-01-31',
          calculationType: 'MOVE_IN',
        })
      ).toThrow('Money amount cannot be negative')
    })

    it('should throw error for dates spanning multiple months', () => {
      expect(() =>
        useCase.execute({
          monthlyRent: 1000,
          startDate: '2025-01-15',
          endDate: '2025-02-15',
          calculationType: 'MOVE_IN',
        })
      ).toThrow('Start and end dates must be in the same month')
    })
  })
})
