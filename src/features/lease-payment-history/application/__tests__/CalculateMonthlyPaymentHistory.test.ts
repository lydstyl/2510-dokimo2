import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculateMonthlyPaymentHistory } from '../CalculateMonthlyPaymentHistory';
import { ILeaseRepository } from '@/use-cases/interfaces/ILeaseRepository';
import { IPaymentRepository } from '@/use-cases/interfaces/IPaymentRepository';
import { IChargeRepository } from '@/use-cases/interfaces/IChargeRepository';
import { IRentRevisionRepository } from '@/use-cases/interfaces/IRentRevisionRepository';
import { ILeaseRentOverrideRepository } from '@/features/rent-override/application/interfaces/ILeaseRentOverrideRepository';
import { Lease } from '@/domain/entities/Lease';
import { Payment } from '@/domain/entities/Payment';
import { Charge } from '@/domain/entities/Charge';
import { RentRevision } from '@/domain/entities/RentRevision';
import { LeaseRentOverride } from '@/features/rent-override/domain/LeaseRentOverride';
import { Money } from '@/domain/value-objects/Money';

describe('CalculateMonthlyPaymentHistory', () => {
  let useCase: CalculateMonthlyPaymentHistory;
  let mockLeaseRepo: ILeaseRepository;
  let mockPaymentRepo: IPaymentRepository;
  let mockChargeRepo: IChargeRepository;
  let mockRentRevisionRepo: IRentRevisionRepository;
  let mockRentOverrideRepo: ILeaseRentOverrideRepository;

  beforeEach(() => {
    mockLeaseRepo = {
      findById: vi.fn(),
      findByPropertyId: vi.fn(),
      findByTenantId: vi.fn(),
      findActiveLeases: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockPaymentRepo = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findByLeaseIdAndPeriod: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockChargeRepo = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockRentRevisionRepo = {
      findById: vi.fn(),
      findByLeaseId: vi.fn(),
      findByLeaseIdOrderedByDate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockRentOverrideRepo = {
      findByLeaseIdAndMonth: vi.fn(),
      findAllByLeaseId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CalculateMonthlyPaymentHistory(
      mockLeaseRepo,
      mockPaymentRepo,
      mockChargeRepo,
      mockRentRevisionRepo,
      mockRentOverrideRepo
    );
  });

  describe('Basic running balance calculation', () => {
    it('should calculate running balance correctly over multiple months', async () => {
      // Arrange: Lease with 3 months, some payments made
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // January: No payment (owe 350)
      // February: Paid 300 (still owe 350 + 350 - 300 = 400)
      // March: Paid full (owe 400 + 350 - 750 = 0)
      const payments = [
        Payment.create({
          id: 'pay-1',
          leaseId: 'lease-1',
          amount: Money.create(300),
          paymentDate: new Date('2026-02-05'),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Payment.create({
          id: 'pay-2',
          leaseId: 'lease-1',
          amount: Money.create(750),
          paymentDate: new Date('2026-03-05'),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue(payments);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute('lease-1', '2026-01', '2026-03');

      // Assert
      expect(result).toHaveLength(3);

      // January
      expect(result[0].month).toBe('2026-01');
      expect(result[0].balanceBefore).toBe(0);
      expect(result[0].totalPaid).toBe(0);
      expect(result[0].balanceAfter).toBe(-350); // owe 350
      expect(result[0].receiptType).toBe('unpaid');

      // February
      expect(result[1].month).toBe('2026-02');
      expect(result[1].balanceBefore).toBe(-350);
      expect(result[1].totalPaid).toBe(300);
      expect(result[1].balanceAfter).toBe(-400); // -350 + 300 - 350 = -400
      expect(result[1].receiptType).toBe('partial');

      // March
      expect(result[2].month).toBe('2026-03');
      expect(result[2].balanceBefore).toBe(-400);
      expect(result[2].totalPaid).toBe(750);
      expect(result[2].balanceAfter).toBe(0); // -400 + 750 - 350 = 0
      expect(result[2].receiptType).toBe('full');
    });

    it('should handle floating point precision correctly', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(348.59),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(398.59),
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-01');

      expect(result[0].balanceAfter).toBe(0); // Should be normalized to 0 (within tolerance)
      expect(result[0].receiptType).toBe('full');
    });
  });

  describe('Receipt type determination', () => {
    it('should return "full" when balance is exactly zero', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(350),
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-01');

      expect(result[0].balanceAfter).toBe(0);
      expect(result[0].receiptType).toBe('full');
    });

    it('should return "partial" when balance is negative (debt)', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(200), // Partial payment
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-01');

      expect(result[0].balanceAfter).toBe(-150); // 200 - 350 = -150
      expect(result[0].receiptType).toBe('partial');
    });

    it('should return "overpayment" when balance is positive (credit)', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(500), // Overpayment
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-01');

      expect(result[0].balanceAfter).toBe(150); // 500 - 350 = +150
      expect(result[0].receiptType).toBe('overpayment');
    });

    it('should return "unpaid" when no payment and no credit', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-01');

      expect(result[0].totalPaid).toBe(0);
      expect(result[0].balanceAfter).toBe(-350);
      expect(result[0].receiptType).toBe('unpaid');
    });

    it('should return "full" when no payment but credit covers rent', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // January: Overpayment of 500 (credit +150)
      // February: No payment, but credit covers rent (150 - 350 = -200, but should be "full" if balanceAfter >= 0)
      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(500),
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-02');

      // January: overpayment
      expect(result[0].balanceAfter).toBe(150);
      expect(result[0].receiptType).toBe('overpayment');

      // February: credit doesn't fully cover, so partial
      expect(result[1].totalPaid).toBe(0);
      expect(result[1].balanceBefore).toBe(150);
      expect(result[1].balanceAfter).toBe(-200); // 150 - 350 = -200
      expect(result[1].receiptType).toBe('partial'); // Credit didn't cover all rent
    });
  });

  describe('Rent revisions (IRL increases)', () => {
    it('should apply rent revision starting from effective date', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Rent revision starting Feb 2026: rent increases to 320
      const revision = RentRevision.create({
        id: 'rev-1',
        leaseId: 'lease-1',
        rentAmount: Money.create(320),
        chargesAmount: Money.create(50),
        effectiveDate: new Date('2026-02-01'),
        reason: 'IRL increase',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([revision]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-03');

      // January: base rent (300)
      expect(result[0].rentAmount).toBe(300);
      expect(result[0].monthlyRent).toBe(350);

      // February: revised rent (320)
      expect(result[1].rentAmount).toBe(320);
      expect(result[1].monthlyRent).toBe(370);

      // March: still revised rent
      expect(result[2].rentAmount).toBe(320);
      expect(result[2].monthlyRent).toBe(370);
    });

    it('should recalculate balance with new rent amount after revision', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const revision = RentRevision.create({
        id: 'rev-1',
        leaseId: 'lease-1',
        rentAmount: Money.create(320),
        chargesAmount: Money.create(50),
        effectiveDate: new Date('2026-02-01'),
        reason: 'IRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Tenant pays same amount in Feb, but rent increased
      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(350), // Old amount
        paymentDate: new Date('2026-02-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([revision]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-02');

      // January: unpaid (owe 350)
      expect(result[0].balanceAfter).toBe(-350);

      // February: paid 350 but owe 370 (balanceBefore -350, paid +350, owe -370 = -370)
      expect(result[1].balanceBefore).toBe(-350);
      expect(result[1].totalPaid).toBe(350);
      expect(result[1].balanceAfter).toBe(-370); // -350 + 350 - 370 = -370
      expect(result[1].receiptType).toBe('partial');
    });
  });

  describe('Rent overrides (manual corrections)', () => {
    it('should apply override instead of revision for specific month', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const revision = RentRevision.create({
        id: 'rev-1',
        leaseId: 'lease-1',
        rentAmount: Money.create(320),
        chargesAmount: Money.create(50),
        effectiveDate: new Date('2026-01-01'),
        reason: 'IRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Override for Feb only: set rent to 310 (lower than revision)
      const override = LeaseRentOverride.create({
        id: 'override-1',
        leaseId: 'lease-1',
        month: '2026-02',
        rentAmount: Money.create(310),
        chargesAmount: Money.create(50),
        reason: 'Special discount',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([revision]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([override]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-03');

      // January: revision applies (320)
      expect(result[0].rentAmount).toBe(320);

      // February: override applies (310, not 320)
      expect(result[1].rentAmount).toBe(310);
      expect(result[1].monthlyRent).toBe(360);

      // March: back to revision (320)
      expect(result[2].rentAmount).toBe(320);
    });
  });

  describe('Additional charges', () => {
    it('should add charges to balance due', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'),
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Additional charge in February (e.g., repairs)
      const charge = Charge.create({
        id: 'charge-1',
        leaseId: 'lease-1',
        amount: Money.create(100),
        chargeDate: new Date('2026-02-15'),
        description: 'Réparations',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(350),
        paymentDate: new Date('2026-02-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([charge]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      const result = await useCase.execute('lease-1', '2026-01', '2026-02');

      // January: unpaid
      expect(result[0].balanceAfter).toBe(-350);

      // February: paid 350, but owe 350 (rent) + 100 (charge)
      expect(result[1].totalCharges).toBe(100);
      expect(result[1].balanceBefore).toBe(-350);
      expect(result[1].balanceAfter).toBe(-450); // -350 + 350 - 350 - 100 = -450
      expect(result[1].receiptType).toBe('partial');
    });
  });

  describe('executeForSingleMonth()', () => {
    it('should calculate from lease start to get correct running balance', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-01-01'), // Start in January
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Payment only in January (creates debt for Feb)
      const payment = Payment.create({
        id: 'pay-1',
        leaseId: 'lease-1',
        amount: Money.create(200),
        paymentDate: new Date('2026-01-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([payment]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      // Request February data
      const result = await useCase.executeForSingleMonth('lease-1', '2026-02');

      // Should return only February data, but balanceBefore includes January
      expect(result.month).toBe('2026-02');
      expect(result.balanceBefore).toBe(-150); // January: 200 - 350 = -150
      expect(result.balanceAfter).toBe(-500); // -150 + 0 - 350 = -500
    });

    it('should throw error if month not found', async () => {
      const lease = Lease.create({
        id: 'lease-1',
        propertyId: 'prop-1',
        tenantIds: ['tenant-1'],
        startDate: new Date('2026-03-01'), // Starts in March
        rentAmount: Money.create(300),
        chargesAmount: Money.create(50),
        paymentDueDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(lease);
      vi.mocked(mockPaymentRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockChargeRepo.findByLeaseId).mockResolvedValue([]);
      vi.mocked(mockRentRevisionRepo.findByLeaseIdOrderedByDate).mockResolvedValue([]);
      vi.mocked(mockRentOverrideRepo.findAllByLeaseId).mockResolvedValue([]);

      // Request January (before lease start)
      await expect(
        useCase.executeForSingleMonth('lease-1', '2026-01')
      ).rejects.toThrow('No data found for month 2026-01');
    });
  });

  describe('Error handling', () => {
    it('should throw error if lease not found', async () => {
      vi.mocked(mockLeaseRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.execute('invalid-lease', '2026-01', '2026-01')
      ).rejects.toThrow('Lease not found');
    });
  });
});
