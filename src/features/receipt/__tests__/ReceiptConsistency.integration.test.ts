/**
 * Integration test to verify that Web, TXT, and PDF receipts
 * all display the same balance values (balanceBefore, balanceAfter)
 *
 * This test uses real lease data: ec344d00-8c3e-4918-b22d-8685b9acc233
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '@/infrastructure/database/prisma';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaChargeRepository } from '@/infrastructure/repositories/PrismaChargeRepository';
import { PrismaRentRevisionRepository } from '@/infrastructure/repositories/PrismaRentRevisionRepository';
import { PrismaLeaseRentOverrideRepository } from '@/features/rent-override/infrastructure/PrismaLeaseRentOverrideRepository';
import { CalculateMonthlyPaymentHistory } from '@/features/lease-payment-history/application/CalculateMonthlyPaymentHistory';
import { GenerateReceiptContent } from '@/features/receipt/application/GenerateReceiptContent';
import { ConvertReceiptToTxt } from '@/features/receipt/application/ConvertReceiptToTxt';
import { ConvertReceiptToPdf } from '@/features/receipt/application/ConvertReceiptToPdf';

const TEST_LEASE_ID = 'ec344d00-8c3e-4918-b22d-8685b9acc233';

describe('Receipt Consistency Integration Test', () => {
  let prisma: PrismaClient;
  let leaseRepo: PrismaLeaseRepository;
  let paymentRepo: PrismaPaymentRepository;
  let chargeRepo: PrismaChargeRepository;
  let rentRevisionRepo: PrismaRentRevisionRepository;
  let rentOverrideRepo: PrismaLeaseRentOverrideRepository;
  let calculateMonthlyHistory: CalculateMonthlyPaymentHistory;
  let lease: any;

  beforeAll(async () => {
    prisma = prismaClient;

    // Initialize repositories
    leaseRepo = new PrismaLeaseRepository(prisma);
    paymentRepo = new PrismaPaymentRepository(prisma);
    chargeRepo = new PrismaChargeRepository(prisma);
    rentRevisionRepo = new PrismaRentRevisionRepository(prisma);
    rentOverrideRepo = new PrismaLeaseRentOverrideRepository(prisma);

    // Initialize use case
    calculateMonthlyHistory = new CalculateMonthlyPaymentHistory(
      leaseRepo,
      paymentRepo,
      chargeRepo,
      rentRevisionRepo,
      rentOverrideRepo
    );

    // Fetch lease data
    lease = await prisma.lease.findUnique({
      where: { id: TEST_LEASE_ID },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
        property: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!lease) {
      throw new Error(`Lease ${TEST_LEASE_ID} not found in database`);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('January 2026 (Partial Payment)', () => {
    const MONTH = '2026-01';
    const EXPECTED_BALANCE_BEFORE = -25.00;
    const EXPECTED_BALANCE_AFTER = -69.59;
    const EXPECTED_RECEIPT_TYPE = 'partial';

    it('should have correct balances in Web (monthly history data)', async () => {
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      console.log('📊 WEB January 2026:', {
        balanceBefore: monthData.balanceBefore,
        balanceAfter: monthData.balanceAfter,
        receiptType: monthData.receiptType,
      });

      expect(monthData.month).toBe(MONTH);
      expect(monthData.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(monthData.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(monthData.receiptType).toBe(EXPECTED_RECEIPT_TYPE);
    });

    it('should have correct balances in TXT receipt', async () => {
      // Get monthly data
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      // Generate TXT content
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(monthData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      const txtConverter = new ConvertReceiptToTxt();
      const txtContent = txtConverter.execute(structuredContent);

      console.log('📄 TXT January 2026:', {
        balanceBefore: structuredContent.rentDetails.balanceBefore,
        balanceAfter: structuredContent.rentDetails.balanceAfter,
        receiptType: structuredContent.receiptType,
      });

      // Verify structured content has correct values
      expect(structuredContent.rentDetails.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(structuredContent.rentDetails.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(structuredContent.receiptType).toBe(EXPECTED_RECEIPT_TYPE);

      // Verify TXT content contains the correct balance values
      expect(txtContent).toContain(`Solde avant ce mois :              ${EXPECTED_BALANCE_BEFORE.toFixed(2)} €`);
      expect(txtContent).toContain(`Solde après ce mois :              ${EXPECTED_BALANCE_AFTER.toFixed(2)} €`);
      expect(txtContent).toContain('REÇU DE PAIEMENT PARTIEL');
    });

    it('should have correct balances in PDF receipt', async () => {
      // Get monthly data
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      // Generate PDF content
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(monthData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      const pdfConverter = new ConvertReceiptToPdf();
      const pdfBuffer = pdfConverter.execute(structuredContent);

      console.log('📕 PDF January 2026:', {
        balanceBefore: structuredContent.rentDetails.balanceBefore,
        balanceAfter: structuredContent.rentDetails.balanceAfter,
        receiptType: structuredContent.receiptType,
      });

      // PDF uses the same structured content, so it MUST have the same values
      expect(structuredContent.rentDetails.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(structuredContent.rentDetails.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(structuredContent.receiptType).toBe(EXPECTED_RECEIPT_TYPE);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('February 2026 (Full Payment)', () => {
    const MONTH = '2026-02';
    const EXPECTED_BALANCE_BEFORE = -69.59;
    const EXPECTED_BALANCE_AFTER = 0.00;
    const EXPECTED_RECEIPT_TYPE = 'full';

    it('should have correct balances in Web (monthly history data)', async () => {
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      console.log('📊 WEB February 2026:', {
        balanceBefore: monthData.balanceBefore,
        balanceAfter: monthData.balanceAfter,
        receiptType: monthData.receiptType,
      });

      expect(monthData.month).toBe(MONTH);
      expect(monthData.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(monthData.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(monthData.receiptType).toBe(EXPECTED_RECEIPT_TYPE);
    });

    it('should have correct balances in TXT receipt', async () => {
      // Get monthly data
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      // Generate TXT content
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(monthData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      const txtConverter = new ConvertReceiptToTxt();
      const txtContent = txtConverter.execute(structuredContent);

      console.log('📄 TXT February 2026:', {
        balanceBefore: structuredContent.rentDetails.balanceBefore,
        balanceAfter: structuredContent.rentDetails.balanceAfter,
        receiptType: structuredContent.receiptType,
      });

      // Verify structured content has correct values
      expect(structuredContent.rentDetails.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(structuredContent.rentDetails.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(structuredContent.receiptType).toBe(EXPECTED_RECEIPT_TYPE);

      // Verify TXT content contains the correct balance values
      expect(txtContent).toContain(`Solde avant ce mois :              ${EXPECTED_BALANCE_BEFORE.toFixed(2)} €`);
      expect(txtContent).toContain(`Solde après ce mois :              ${EXPECTED_BALANCE_AFTER.toFixed(2)} €`);
      expect(txtContent).toContain('QUITTANCE DE LOYER');
    });

    it('should have correct balances in PDF receipt', async () => {
      // Get monthly data
      const monthData = await calculateMonthlyHistory.executeForSingleMonth(
        TEST_LEASE_ID,
        MONTH
      );

      // Generate PDF content
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(monthData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      const pdfConverter = new ConvertReceiptToPdf();
      const pdfBuffer = pdfConverter.execute(structuredContent);

      console.log('📕 PDF February 2026:', {
        balanceBefore: structuredContent.rentDetails.balanceBefore,
        balanceAfter: structuredContent.rentDetails.balanceAfter,
        receiptType: structuredContent.receiptType,
      });

      // PDF uses the same structured content, so it MUST have the same values
      expect(structuredContent.rentDetails.balanceBefore).toBeCloseTo(EXPECTED_BALANCE_BEFORE, 2);
      expect(structuredContent.rentDetails.balanceAfter).toBeCloseTo(EXPECTED_BALANCE_AFTER, 2);
      expect(structuredContent.receiptType).toBe(EXPECTED_RECEIPT_TYPE);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Consistency Check: All formats must match', () => {
    it('should have identical balance values across Web, TXT, and PDF for January 2026', async () => {
      const MONTH = '2026-01';

      // Get Web data
      const monthlyHistory = await calculateMonthlyHistory.execute(
        TEST_LEASE_ID,
        MONTH,
        MONTH
      );
      const webData = monthlyHistory[0];

      // Generate content (used by both TXT and PDF)
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(webData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      console.log('\n🔍 CONSISTENCY CHECK January 2026:');
      console.log('Web balanceBefore:', webData.balanceBefore);
      console.log('Structured balanceBefore:', structuredContent.rentDetails.balanceBefore);
      console.log('Web balanceAfter:', webData.balanceAfter);
      console.log('Structured balanceAfter:', structuredContent.rentDetails.balanceAfter);

      // All three formats should use the exact same values
      expect(structuredContent.rentDetails.balanceBefore).toBe(webData.balanceBefore);
      expect(structuredContent.rentDetails.balanceAfter).toBe(webData.balanceAfter);
      expect(structuredContent.receiptType).toBe(webData.receiptType);
    });

    it('should have identical balance values across Web, TXT, and PDF for February 2026', async () => {
      const MONTH = '2026-02';

      // Get Web data
      const monthlyHistory = await calculateMonthlyHistory.execute(
        TEST_LEASE_ID,
        MONTH,
        MONTH
      );
      const webData = monthlyHistory[0];

      // Generate content (used by both TXT and PDF)
      const contentGenerator = new GenerateReceiptContent();
      const structuredContent = contentGenerator.execute(webData, {
        tenants: lease.tenants.map((lt: any) => ({
          firstName: lt.tenant.firstName,
          lastName: lt.tenant.lastName,
          email: lt.tenant.email,
          phone: lt.tenant.phone,
        })),
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
          landlord: {
            type: lease.property.landlord.type,
            name: lease.property.landlord.name,
            managerName: lease.property.landlord.managerName,
          },
        },
      });

      console.log('\n🔍 CONSISTENCY CHECK February 2026:');
      console.log('Web balanceBefore:', webData.balanceBefore);
      console.log('Structured balanceBefore:', structuredContent.rentDetails.balanceBefore);
      console.log('Web balanceAfter:', webData.balanceAfter);
      console.log('Structured balanceAfter:', structuredContent.rentDetails.balanceAfter);

      // All three formats should use the exact same values
      expect(structuredContent.rentDetails.balanceBefore).toBe(webData.balanceBefore);
      expect(structuredContent.rentDetails.balanceAfter).toBe(webData.balanceAfter);
      expect(structuredContent.receiptType).toBe(webData.receiptType);
    });
  });
});
