import { describe, it, expect } from 'vitest';
import { RentRevision, RentRevisionStatus } from '../RentRevision';
import { Money } from '@/domain/value-objects/Money';

describe('RentRevision', () => {
  describe('create', () => {
    it('should create a valid rent revision', () => {
      const effectiveDate = new Date('2026-03-01');
      const rentAmount = Money.create(850);
      const chargesAmount = Money.create(70);

      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate,
        rentAmount,
        chargesAmount,
        reason: 'IRL_REVISION',
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.id).toBe('revision-1');
      expect(revision.leaseId).toBe('lease-1');
      expect(revision.effectiveDate).toEqual(effectiveDate);
      expect(revision.rentAmount.getValue()).toBe(850);
      expect(revision.chargesAmount.getValue()).toBe(70);
      expect(revision.reason).toBe('IRL_REVISION');
      expect(revision.status).toBe(RentRevisionStatus.EN_PREPARATION);
    });

    it('should throw error if effectiveDate is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(() =>
        RentRevision.create({
          id: 'revision-1',
          leaseId: 'lease-1',
          effectiveDate: yesterday,
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          reason: 'IRL_REVISION',
          status: RentRevisionStatus.EN_PREPARATION,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Effective date cannot be in the past');
    });

    it('should throw error if leaseId is empty', () => {
      expect(() =>
        RentRevision.create({
          id: 'revision-1',
          leaseId: '',
          effectiveDate: new Date('2026-03-01'),
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          status: RentRevisionStatus.EN_PREPARATION,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Lease ID is required');
    });
  });

  describe('totalAmount', () => {
    it('should return total rent including charges', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const total = revision.totalAmount();
      expect(total.getValue()).toBe(920);
    });
  });

  describe('isInPreparation', () => {
    it('should return true if status is EN_PREPARATION', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isInPreparation()).toBe(true);
    });

    it('should return false if status is COURRIER_AR_ENVOYE', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.COURRIER_AR_ENVOYE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isInPreparation()).toBe(false);
    });
  });

  describe('isLetterSent', () => {
    it('should return true if status is COURRIER_AR_ENVOYE', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.COURRIER_AR_ENVOYE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isLetterSent()).toBe(true);
    });

    it('should return false if status is EN_PREPARATION', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isLetterSent()).toBe(false);
    });
  });

  describe('isUrgent', () => {
    it('should return true if effective date is within 2 months and status is EN_PREPARATION', () => {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: oneMonthFromNow,
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isUrgent()).toBe(true);
    });

    it('should return false if effective date is more than 2 months away', () => {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: threeMonthsFromNow,
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isUrgent()).toBe(false);
    });

    it('should return false if status is COURRIER_AR_ENVOYE even if within 2 months', () => {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: oneMonthFromNow,
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.COURRIER_AR_ENVOYE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.isUrgent()).toBe(false);
    });
  });

  describe('markAsLetterSent', () => {
    it('should change status to COURRIER_AR_ENVOYE', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedRevision = revision.markAsLetterSent();
      expect(updatedRevision.status).toBe(RentRevisionStatus.COURRIER_AR_ENVOYE);
      expect(updatedRevision.isInPreparation()).toBe(false);
      expect(updatedRevision.isLetterSent()).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should change status to CANCELLED', () => {
      const revision = RentRevision.create({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: new Date('2026-03-01'),
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cancelledRevision = revision.cancel();
      expect(cancelledRevision.status).toBe(RentRevisionStatus.CANCELLED);
      expect(cancelledRevision.isInPreparation()).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a revision with a past effective date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const revision = RentRevision.reconstitute({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: yesterday,
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        reason: 'IRL_REVISION',
        status: RentRevisionStatus.COURRIER_AR_ENVOYE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.id).toBe('revision-1');
      expect(revision.effectiveDate).toEqual(yesterday);
      expect(revision.status).toBe(RentRevisionStatus.COURRIER_AR_ENVOYE);
    });

    it('should reconstitute a revision with a future effective date', () => {
      const futureDate = new Date('2026-06-01');

      const revision = RentRevision.reconstitute({
        id: 'revision-1',
        leaseId: 'lease-1',
        effectiveDate: futureDate,
        rentAmount: Money.create(850),
        chargesAmount: Money.create(70),
        status: RentRevisionStatus.EN_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(revision.effectiveDate).toEqual(futureDate);
      expect(revision.status).toBe(RentRevisionStatus.EN_PREPARATION);
    });

    it('should throw error if leaseId is empty', () => {
      expect(() =>
        RentRevision.reconstitute({
          id: 'revision-1',
          leaseId: '',
          effectiveDate: new Date('2025-01-01'),
          rentAmount: Money.create(850),
          chargesAmount: Money.create(70),
          status: RentRevisionStatus.COURRIER_AR_ENVOYE,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Lease ID is required');
    });
  });
});
