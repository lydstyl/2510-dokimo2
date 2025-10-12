import { describe, it, expect } from 'vitest';
import { Email } from '../Email';

describe('Email', () => {
  describe('create', () => {
    it('should create Email with valid format', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.create('test@')).toThrow('Invalid email format');
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
      expect(() => Email.create('test @example.com')).toThrow('Invalid email format');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
