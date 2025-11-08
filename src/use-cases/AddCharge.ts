import { Charge } from '../domain/entities/Charge';
import { Money } from '../domain/value-objects/Money';
import { IChargeRepository } from './interfaces/IChargeRepository';
import { randomUUID } from 'crypto';

export interface AddChargeInput {
  leaseId: string;
  amount: number;
  chargeDate: Date;
  description?: string;
}

export class AddCharge {
  constructor(private chargeRepository: IChargeRepository) {}

  async execute(input: AddChargeInput): Promise<Charge> {
    const now = new Date();

    const charge = Charge.create({
      id: randomUUID(),
      leaseId: input.leaseId,
      amount: Money.create(input.amount),
      chargeDate: input.chargeDate,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    });

    return await this.chargeRepository.create(charge);
  }
}
