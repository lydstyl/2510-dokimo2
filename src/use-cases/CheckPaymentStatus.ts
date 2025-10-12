import { ILeaseRepository } from './interfaces/ILeaseRepository';
import { IPaymentRepository } from './interfaces/IPaymentRepository';

export interface PaymentStatusResult {
  isUpToDate: boolean;
  isLate: boolean;
  expectedPaymentDate: Date;
  lastPaymentDate?: Date;
}

export class CheckPaymentStatus {
  constructor(
    private leaseRepository: ILeaseRepository,
    private paymentRepository: IPaymentRepository
  ) {}

  async execute(leaseId: string, referenceDate: Date = new Date()): Promise<PaymentStatusResult> {
    const lease = await this.leaseRepository.findById(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    // Get the first day of the current month
    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

    // Get expected payment date for this month
    const expectedPaymentDate = lease.getExpectedPaymentDate(referenceDate);

    // Find payments for the current period
    const payments = await this.paymentRepository.findByLeaseIdAndPeriod(
      leaseId,
      monthStart,
      monthEnd
    );

    // Check if there's a payment covering this month
    const hasPayment = payments.some(payment => payment.coversMonth(referenceDate));

    let lastPaymentDate: Date | undefined;
    let isLate = false;

    if (payments.length > 0) {
      // Get the most recent payment date
      const sortedPayments = payments.sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()
      );
      lastPaymentDate = sortedPayments[0].paymentDate;

      // Check if payment was late
      isLate = sortedPayments[0].isLatePayment(expectedPaymentDate);
    } else if (referenceDate > expectedPaymentDate) {
      // No payment found and we're past the due date
      isLate = true;
    }

    return {
      isUpToDate: hasPayment,
      isLate,
      expectedPaymentDate,
      lastPaymentDate,
    };
  }
}
