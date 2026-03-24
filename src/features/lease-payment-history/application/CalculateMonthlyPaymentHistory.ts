import { MonthlyPaymentData } from '../domain/MonthlyPaymentData';
import { ILeaseRepository } from '@/use-cases/interfaces/ILeaseRepository';
import { IPaymentRepository } from '@/use-cases/interfaces/IPaymentRepository';
import { IChargeRepository } from '@/use-cases/interfaces/IChargeRepository';
import { IRentRevisionRepository } from '@/use-cases/interfaces/IRentRevisionRepository';
import { ILeaseRentOverrideRepository } from '@/features/rent-override/application/interfaces/ILeaseRentOverrideRepository';
import { GetLeaseRentHistory } from '@/use-cases/GetLeaseRentHistory';

/**
 * Use case: Calculate monthly payment history for a lease
 *
 * This is the single source of truth for monthly payment calculations.
 * It takes into account:
 * - Rent overrides (highest priority)
 * - Rent revisions
 * - Base lease amounts (fallback)
 * - All payments made
 * - All additional charges
 *
 * Returns monthly data that can be used by:
 * - Web UI payment history table
 * - TXT receipt generation
 * - PDF receipt generation
 */
export class CalculateMonthlyPaymentHistory {
  constructor(
    private leaseRepository: ILeaseRepository,
    private paymentRepository: IPaymentRepository,
    private chargeRepository: IChargeRepository,
    private rentRevisionRepository: IRentRevisionRepository,
    private rentOverrideRepository: ILeaseRentOverrideRepository
  ) {}

  /**
   * Execute for a single month, calculating from lease start to get correct running balance
   * This ensures balanceBefore reflects all previous months
   */
  async executeForSingleMonth(
    leaseId: string,
    targetMonth: string
  ): Promise<MonthlyPaymentData> {
    // Get lease to determine start date
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Calculate from lease start date to target month
    const leaseStartDate = new Date(lease.startDate);
    const startMonth = `${leaseStartDate.getFullYear()}-${String(leaseStartDate.getMonth() + 1).padStart(2, '0')}`;

    // Execute for the full range
    const monthlyHistory = await this.execute(leaseId, startMonth, targetMonth);

    // Return the last month (target month)
    const targetData = monthlyHistory.find(m => m.month === targetMonth);
    if (!targetData) {
      throw new Error(`No data found for month ${targetMonth}`);
    }

    return targetData;
  }

  async execute(
    leaseId: string,
    startMonth: string,
    endMonth: string
  ): Promise<MonthlyPaymentData[]> {
    // Get lease
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get rent history with overrides, revisions, and base amounts
    const getRentHistory = new GetLeaseRentHistory(
      this.rentRevisionRepository,
      this.leaseRepository,
      this.rentOverrideRepository
    );
    const rentHistory = await getRentHistory.execute(leaseId, startMonth, endMonth);
    const rentHistoryMap = new Map(rentHistory.map(r => [r.month, r]));

    // Get all payments for this lease
    const allPayments = await this.paymentRepository.findByLeaseId(leaseId);

    // Get all charges for this lease
    const allCharges = await this.chargeRepository.findByLeaseId(leaseId);

    // Group payments by month
    const paymentsByMonth = new Map<string, typeof allPayments>();
    allPayments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const month = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      if (!paymentsByMonth.has(month)) {
        paymentsByMonth.set(month, []);
      }
      paymentsByMonth.get(month)!.push(payment);
    });

    // Group charges by month
    const chargesByMonth = new Map<string, typeof allCharges>();
    allCharges.forEach(charge => {
      const chargeDate = new Date(charge.chargeDate);
      const month = `${chargeDate.getFullYear()}-${String(chargeDate.getMonth() + 1).padStart(2, '0')}`;

      if (!chargesByMonth.has(month)) {
        chargesByMonth.set(month, []);
      }
      chargesByMonth.get(month)!.push(charge);
    });

    // Generate month list from startMonth to endMonth
    const months = this.generateMonthList(startMonth, endMonth);

    // Calculate running balance and generate monthly data
    let runningBalance = 0;
    const monthlyData: MonthlyPaymentData[] = [];

    for (const month of months) {
      const monthRentData = rentHistoryMap.get(month);
      if (!monthRentData) {
        // Skip months without rent data (shouldn't happen but defensive)
        continue;
      }

      const monthPayments = paymentsByMonth.get(month) || [];
      const monthCharges = chargesByMonth.get(month) || [];

      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount.getValue(), 0);
      const totalCharges = monthCharges.reduce((sum, c) => sum + c.amount.getValue(), 0);

      const balanceBefore = runningBalance;

      // Balance calculation: positive = overpayment, negative = debt
      // Balance = what tenant has paid - what they owe
      runningBalance = runningBalance + totalPaid - monthRentData.totalAmount - totalCharges;

      // Normalize near-zero balances to avoid floating point artifacts
      const TOLERANCE = 0.01;
      runningBalance = Math.abs(runningBalance) < TOLERANCE ? 0 : runningBalance;
      const balanceAfter = runningBalance;

      // Determine receipt type
      let receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';

      // Debug logging for month 2026-03
      if (month === '2026-03') {
        console.log(`[DEBUG ${leaseId}] Month: ${month}`);
        console.log(`[DEBUG ${leaseId}] totalPaid: ${totalPaid}`);
        console.log(`[DEBUG ${leaseId}] balanceBefore: ${balanceBefore}`);
        console.log(`[DEBUG ${leaseId}] balanceAfter: ${balanceAfter}`);
        console.log(`[DEBUG ${leaseId}] monthlyRent: ${monthRentData.totalAmount}`);
      }

      if (totalPaid === 0) {
        // No payment this month
        if (balanceBefore > 0) {
          // Had credit before, check if it covers the rent
          if (balanceAfter >= 0) {
            receiptType = 'full'; // Credit covered the rent
          } else {
            receiptType = 'partial'; // Credit didn't cover all the rent
          }
        } else {
          receiptType = 'unpaid'; // No credit and no payment
        }
      } else if (balanceAfter > 0) {
        receiptType = 'overpayment'; // Positive balance (beyond tolerance)
      } else if (balanceAfter === 0) {
        receiptType = 'full'; // Balance is zero (within tolerance)
      } else {
        receiptType = 'partial'; // Still owes money
      }

      // Debug logging for receipt type
      if (month === '2026-03') {
        console.log(`[DEBUG ${leaseId}] receiptType: ${receiptType}`);
      }

      // Generate month label (e.g., "Janvier 2026")
      const [year, monthNum] = month.split('-');
      const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthLabel = monthDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      });

      monthlyData.push({
        month,
        monthLabel,
        rentAmount: monthRentData.rentAmount,
        chargesAmount: monthRentData.chargesAmount,
        monthlyRent: monthRentData.totalAmount,
        payments: monthPayments.map(p => ({
          id: p.id,
          amount: p.amount.getValue(),
          paymentDate: p.paymentDate.toISOString(),
          notes: p.notes || null,
          createdAt: p.createdAt.toISOString()
        })).sort((a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        ),
        charges: monthCharges.map(c => ({
          id: c.id,
          amount: c.amount.getValue(),
          chargeDate: c.chargeDate.toISOString(),
          description: c.description || null,
          createdAt: c.createdAt.toISOString()
        })).sort((a, b) =>
          new Date(b.chargeDate).getTime() - new Date(a.chargeDate).getTime()
        ),
        totalPaid,
        totalCharges,
        balanceBefore,
        balanceAfter,
        receiptType
      });
    }

    return monthlyData;
  }

  private generateMonthList(startMonth: string, endMonth: string): string[] {
    const months: string[] = [];
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);

    const start = Date.UTC(startYear, startMonthNum - 1, 1);
    const end = Date.UTC(endYear, endMonthNum - 1, 1);

    let currentTimestamp = start;
    while (currentTimestamp <= end) {
      const currentDate = new Date(currentTimestamp);
      const yearMonth = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;
      months.push(yearMonth);

      const nextYear = currentDate.getUTCFullYear();
      const nextMonth = currentDate.getUTCMonth() + 1;
      currentTimestamp = Date.UTC(nextYear, nextMonth, 1);
    }

    return months;
  }
}
