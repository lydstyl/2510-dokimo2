import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { ILeaseRepository } from './interfaces/ILeaseRepository';

export interface PaymentCSVRow {
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  type: string;
  notes: string;
}

export class ExportPaymentsToCSV {
  constructor(
    private paymentRepository: IPaymentRepository,
    private leaseRepository: ILeaseRepository
  ) {}

  async execute(leaseId: string): Promise<string> {
    const payments = await this.paymentRepository.findByLeaseId(leaseId);
    const lease = await this.leaseRepository.findById(leaseId);

    if (!lease) {
      throw new Error('Lease not found');
    }

    // Build CSV header
    const headers = [
      'Payment Date',
      'Period Start',
      'Period End',
      'Rent Amount',
      'Charges Amount',
      'Total Amount',
      'Type',
      'Notes',
    ];

    // Build CSV rows
    const rows = payments.map(payment => [
      this.formatDate(payment.paymentDate),
      '', // Period Start - TODO: add to Payment entity
      '', // Period End - TODO: add to Payment entity
      payment.amount.getValue().toFixed(2),
      lease.rentAmount.getValue().toFixed(2),
      lease.chargesAmount.getValue().toFixed(2),
      '', // Type - TODO: add to Payment entity
      payment.notes || '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(',')),
    ].join('\n');

    return csvContent;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private escapeCSV(value: string | number): string {
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}
