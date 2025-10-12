import { Payment } from '../../domain/entities/Payment';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByLeaseId(leaseId: string): Promise<Payment[]>;
  findByLeaseIdAndPeriod(
    leaseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Payment[]>;
  create(payment: Payment): Promise<Payment>;
  update(payment: Payment): Promise<Payment>;
  delete(id: string): Promise<void>;
}
