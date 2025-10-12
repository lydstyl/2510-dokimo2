import { describe, it, expect } from 'vitest';
import { Payment, PaymentType } from '../Payment';
import { Money } from '../../value-objects/Money';

describe('Payment', () => {
  const validPaymentProps = {
    id: '1',
    leaseId: 'lease-1',
    amount: Money.create(1100),
    paymentDate: new Date('2024-03-05'),
    periodStart: new Date('2024-03-01'),
    periodEnd: new Date('2024-03-31'),
    type: PaymentType.FULL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a valid Payment', () => {
      const payment = Payment.create(validPaymentProps);
      expect(payment.id).toBe('1');
      expect(payment.leaseId).toBe('lease-1');
      expect(payment.amount.getValue()).toBe(1100);
      expect(payment.type).toBe(PaymentType.FULL);
    });

    it('should throw error if period end is before period start', () => {
      expect(() =>
        Payment.create({
          ...validPaymentProps,
          periodStart: new Date('2024-03-31'),
          periodEnd: new Date('2024-03-01'),
        })
      ).toThrow('Period end must be after period start');
    });
  });

  describe('isLatePayment', () => {
    it('should return true for late payment', () => {
      const payment = Payment.create({
        ...validPaymentProps,
        paymentDate: new Date('2024-03-10'),
      });
      const expectedDate = new Date('2024-03-05');
      expect(payment.isLatePayment(expectedDate)).toBe(true);
    });

    it('should return false for on-time payment', () => {
      const payment = Payment.create({
        ...validPaymentProps,
        paymentDate: new Date('2024-03-03'),
      });
      const expectedDate = new Date('2024-03-05');
      expect(payment.isLatePayment(expectedDate)).toBe(false);
    });
  });

  describe('coversMonth', () => {
    it('should return true if payment covers the entire month', () => {
      const payment = Payment.create({
        ...validPaymentProps,
        periodStart: new Date('2024-03-01'),
        periodEnd: new Date('2024-03-31'),
      });
      const month = new Date('2024-03-15');
      expect(payment.coversMonth(month)).toBe(true);
    });

    it('should return false if payment does not cover the entire month', () => {
      const payment = Payment.create({
        ...validPaymentProps,
        periodStart: new Date('2024-03-10'),
        periodEnd: new Date('2024-03-20'),
      });
      const month = new Date('2024-03-15');
      expect(payment.coversMonth(month)).toBe(false);
    });
  });
});
