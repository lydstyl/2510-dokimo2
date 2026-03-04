/**
 * Domain entity representing payment data for a single month
 * This is the single source of truth for monthly payment calculations
 * Used by web UI, TXT exports, and PDF exports
 */
export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

export interface Charge {
  id: string;
  amount: number;
  chargeDate: string;
  description: string | null;
  createdAt: string;
}

export interface MonthlyPaymentData {
  /** Month in YYYY-MM format */
  month: string;

  /** Display label for the month (e.g., "Janvier 2026") */
  monthLabel: string;

  /** Rent amount for this month (after revisions/overrides) */
  rentAmount: number;

  /** Charges amount for this month (after revisions/overrides) */
  chargesAmount: number;

  /** Total monthly rent (rentAmount + chargesAmount) */
  monthlyRent: number;

  /** Payments made during this month */
  payments: Payment[];

  /** Additional charges for this month */
  charges: Charge[];

  /** Total amount paid during this month */
  totalPaid: number;

  /** Total additional charges for this month */
  totalCharges: number;

  /** Balance at the start of the month (before payments) */
  balanceBefore: number;

  /** Balance at the end of the month (after payments and charges) */
  balanceAfter: number;

  /** Type of receipt for this month */
  receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
}
