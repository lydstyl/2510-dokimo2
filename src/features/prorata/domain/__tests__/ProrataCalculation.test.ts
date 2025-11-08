import { describe, it, expect } from 'vitest'
import { ProrataCalculation } from '../ProrataCalculation'
import { Money } from '@/domain/value-objects/Money'

describe('ProrataCalculation', () => {
  describe('create', () => {
    it('should create a prorata calculation for incoming tenant', () => {
      const monthlyRent = Money.create(1000)
      const moveInDate = new Date('2025-01-15')
      const daysInMonth = 31
      const daysOccupied = 17 // From 15th to 31st inclusive

      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: moveInDate,
        endDate: new Date('2025-01-31'),
        daysInMonth,
        calculationType: 'MOVE_IN',
      })

      expect(prorata.monthlyRent.amount).toBe(1000)
      expect(prorata.daysOccupied).toBe(daysOccupied)
      expect(prorata.daysInMonth).toBe(daysInMonth)
      expect(prorata.calculationType).toBe('MOVE_IN')
    })

    it('should create a prorata calculation for outgoing tenant', () => {
      const monthlyRent = Money.create(1500)
      const moveOutDate = new Date('2025-02-10')
      const daysInMonth = 28
      const daysOccupied = 10 // From 1st to 10th inclusive

      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-02-01'),
        endDate: moveOutDate,
        daysInMonth,
        calculationType: 'MOVE_OUT',
      })

      expect(prorata.monthlyRent.amount).toBe(1500)
      expect(prorata.daysOccupied).toBe(daysOccupied)
      expect(prorata.calculationType).toBe('MOVE_OUT')
    })

    it('should throw error if start date is after end date', () => {
      const monthlyRent = Money.create(1000)

      expect(() =>
        ProrataCalculation.create({
          monthlyRent,
          startDate: new Date('2025-01-31'),
          endDate: new Date('2025-01-01'),
          daysInMonth: 31,
          calculationType: 'MOVE_IN',
        })
      ).toThrow('Start date must be before or equal to end date')
    })

    it('should throw error if days in month is invalid', () => {
      const monthlyRent = Money.create(1000)

      expect(() =>
        ProrataCalculation.create({
          monthlyRent,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-01-31'),
          daysInMonth: 35,
          calculationType: 'MOVE_IN',
        })
      ).toThrow('Days in month must be between 28 and 31')
    })
  })

  describe('calculateProrataAmount', () => {
    it('should calculate correct prorata for incoming tenant (mid-month)', () => {
      const monthlyRent = Money.create(1000)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-01-15'), // 15th
        endDate: new Date('2025-01-31'), // 31st
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const prorataAmount = prorata.calculateProrataAmount()
      // 17 days (15th to 31st inclusive) / 31 days * 1000 = 548.39
      expect(prorataAmount.amount).toBeCloseTo(548.39, 2)
    })

    it('should calculate correct prorata for outgoing tenant', () => {
      const monthlyRent = Money.create(1500)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-10'),
        daysInMonth: 28,
        calculationType: 'MOVE_OUT',
      })

      const prorataAmount = prorata.calculateProrataAmount()
      // 10 days / 28 days * 1500 = 535.71
      expect(prorataAmount.amount).toBeCloseTo(535.71, 2)
    })

    it('should return full rent for complete month', () => {
      const monthlyRent = Money.create(1200)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-31'),
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const prorataAmount = prorata.calculateProrataAmount()
      expect(prorataAmount.amount).toBe(1200)
    })

    it('should handle single day occupancy', () => {
      const monthlyRent = Money.create(3100)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-01-31'),
        endDate: new Date('2025-01-31'),
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const prorataAmount = prorata.calculateProrataAmount()
      // 1 day / 31 days * 3100 = 100
      expect(prorataAmount.amount).toBeCloseTo(100, 2)
    })
  })

  describe('getProrataPercentage', () => {
    it('should return correct percentage', () => {
      const monthlyRent = Money.create(1000)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31'),
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const percentage = prorata.getProrataPercentage()
      // 17 / 31 = 54.84%
      expect(percentage).toBeCloseTo(54.84, 2)
    })

    it('should return 100% for full month', () => {
      const monthlyRent = Money.create(1000)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const percentage = prorata.getProrataPercentage()
      expect(percentage).toBe(100)
    })
  })

  describe('getDailyRate', () => {
    it('should calculate correct daily rate', () => {
      const monthlyRent = Money.create(3100)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31'),
        daysInMonth: 31,
        calculationType: 'MOVE_IN',
      })

      const dailyRate = prorata.getDailyRate()
      // 3100 / 31 = 100
      expect(dailyRate.amount).toBe(100)
    })

    it('should round daily rate to 2 decimals', () => {
      const monthlyRent = Money.create(1000)
      const prorata = ProrataCalculation.create({
        monthlyRent,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
        daysInMonth: 28,
        calculationType: 'MOVE_IN',
      })

      const dailyRate = prorata.getDailyRate()
      // 1000 / 28 = 35.71...
      expect(dailyRate.amount).toBeCloseTo(35.71, 2)
    })
  })
})
