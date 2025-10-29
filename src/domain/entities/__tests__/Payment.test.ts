import { describe, it, expect } from 'vitest';
import { Payment } from '../Payment';
import { Money } from '../../value-objects/Money';

describe('Payment', () => {
  const validPaymentProps = {
    id: '1',
    leaseId: 'lease-1',
    amount: Money.create(1100),
    paymentDate: new Date('2024-03-05'),
    notes: 'Test payment',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a valid Payment', () => {
      const payment = Payment.create(validPaymentProps);
      expect(payment.id).toBe('1');
      expect(payment.leaseId).toBe('lease-1');
      expect(payment.amount.getValue()).toBe(1100);
      expect(payment.paymentDate).toEqual(new Date('2024-03-05'));
    });

    it('should create a payment without notes', () => {
      const payment = Payment.create({
        ...validPaymentProps,
        notes: undefined,
      });
      expect(payment.notes).toBeUndefined();
    });
  });
});
