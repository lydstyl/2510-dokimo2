import { describe, it, expect } from 'vitest';
import { Money } from '../Money';

describe('Money', () => {
  describe('create', () => {
    it('should create a Money instance with valid amount', () => {
      const money = Money.create(100);
      expect(money.getValue()).toBe(100);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-10)).toThrow('Money amount cannot be negative');
    });

    it('should create Money with zero amount', () => {
      const money = Money.create(0);
      expect(money.getValue()).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two Money instances', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(50);
      const result = money1.add(money2);
      expect(result.getValue()).toBe(150);
    });
  });

  describe('subtract', () => {
    it('should subtract Money instances', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(30);
      const result = money1.subtract(money2);
      expect(result.getValue()).toBe(70);
    });

    it('should throw error if result is negative', () => {
      const money1 = Money.create(50);
      const money2 = Money.create(100);
      expect(() => money1.subtract(money2)).toThrow('Money amount cannot be negative');
    });
  });

  describe('comparison methods', () => {
    it('should compare Money instances correctly', () => {
      const money1 = Money.create(100);
      const money2 = Money.create(50);
      const money3 = Money.create(100);

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(true);
      expect(money1.equals(money3)).toBe(true);
      expect(money1.equals(money2)).toBe(false);
    });
  });
});
