import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { IChargeRepository } from './interfaces/IChargeRepository';

export interface BalanceCalculation {
  totalPaid: number;
  totalExpected: number;
  totalCharges: number;
  balance: number;
}

/**
 * Use case: Calculate the balance for a lease at a specific date
 * Takes into account all rent revisions, payments, and additional charges up to that date
 */
export class CalculateLeaseBalance {
  constructor(
    private rentRevisionRepository: IRentRevisionRepository,
    private leaseRepository: ILeaseRepository,
    private paymentRepository: IPaymentRepository,
    private chargeRepository: IChargeRepository
  ) {}

  async execute(leaseId: string, upToDate: Date): Promise<BalanceCalculation> {
    // Get lease
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get all rent revisions, ordered by effective date
    const revisions = await this.rentRevisionRepository.findByLeaseIdOrderedByDate(leaseId);

    // Get all payments up to the specified date
    const payments = await this.paymentRepository.findByLeaseIdAndPeriod(
      leaseId,
      lease.startDate,
      upToDate
    );

    // Calculate total paid
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + payment.amount.getValue();
    }, 0);

    // Get all additional charges up to the specified date
    const allCharges = await this.chargeRepository.findByLeaseId(leaseId);
    const chargesUpToDate = allCharges.filter(charge => charge.chargeDate <= upToDate);

    // Calculate total additional charges
    const totalCharges = chargesUpToDate.reduce((sum, charge) => {
      return sum + charge.amount.getValue();
    }, 0);

    // Calculate total expected by iterating through each month
    let totalExpected = 0;
    const startDate = new Date(lease.startDate);
    const currentMonth = new Date(startDate);
    currentMonth.setDate(1); // Set to first day of month

    while (currentMonth <= upToDate) {
      // Find applicable rent for this month
      let monthlyRent = lease.rentAmount.getValue() + lease.chargesAmount.getValue();

      // Check if there's a revision applicable to this month
      for (const revision of revisions) {
        const revisionDate = new Date(
          revision.effectiveDate.getFullYear(),
          revision.effectiveDate.getMonth(),
          1
        );

        if (revisionDate <= currentMonth) {
          monthlyRent = revision.totalAmount.getValue();
        } else {
          break; // Revisions are ordered, so we can stop
        }
      }

      totalExpected += monthlyRent;

      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Balance = totalPaid - (totalExpected + totalCharges)
    // Negative balance means tenant owes money
    const balance = totalPaid - totalExpected - totalCharges;

    return {
      totalPaid,
      totalExpected,
      totalCharges,
      balance,
    };
  }

  /**
   * Calculate balance before and after a specific payment
   */
  async executeForPayment(
    leaseId: string,
    paymentId: string
  ): Promise<{ balanceBefore: number; balanceAfter: number; paymentAmount: number }> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Calculate balance just before this payment
    const beforeDate = new Date(payment.paymentDate);
    beforeDate.setDate(beforeDate.getDate() - 1);

    const beforeCalc = await this.execute(leaseId, beforeDate);

    // Calculate balance including this payment
    const afterCalc = await this.execute(leaseId, payment.paymentDate);

    return {
      balanceBefore: beforeCalc.balance,
      balanceAfter: afterCalc.balance,
      paymentAmount: payment.amount.getValue(),
    };
  }
}
