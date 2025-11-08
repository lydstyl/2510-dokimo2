import { describe, it, expect, beforeEach } from 'vitest';
import { AddCharge } from '../AddCharge';
import { Charge } from '../../domain/entities/Charge';
import { Money } from '../../domain/value-objects/Money';
import { IChargeRepository } from '../interfaces/IChargeRepository';

// Mock repository
class MockChargeRepository implements IChargeRepository {
  private charges: Charge[] = [];

  async findById(id: string): Promise<Charge | null> {
    return this.charges.find(c => c.id === id) || null;
  }

  async findByLeaseId(leaseId: string): Promise<Charge[]> {
    return this.charges.filter(c => c.leaseId === leaseId);
  }

  async create(charge: Charge): Promise<Charge> {
    this.charges.push(charge);
    return charge;
  }

  async update(charge: Charge): Promise<Charge> {
    const index = this.charges.findIndex(c => c.id === charge.id);
    if (index !== -1) {
      this.charges[index] = charge;
    }
    return charge;
  }

  async delete(id: string): Promise<void> {
    this.charges = this.charges.filter(c => c.id !== id);
  }

  // Helper for testing
  getAll(): Charge[] {
    return this.charges;
  }
}

describe('AddCharge', () => {
  let chargeRepository: MockChargeRepository;
  let addCharge: AddCharge;

  beforeEach(() => {
    chargeRepository = new MockChargeRepository();
    addCharge = new AddCharge(chargeRepository);
  });

  it('should add a charge with valid data', async () => {
    const chargeData = {
      leaseId: 'lease-1',
      amount: 500,
      chargeDate: new Date('2025-01-15'),
      description: 'Dépôt de garantie',
    };

    const charge = await addCharge.execute(chargeData);

    expect(charge.id).toBeTruthy(); // ID is auto-generated
    expect(charge.leaseId).toBe('lease-1');
    expect(charge.amount.getAmount()).toBe(500);
    expect(charge.chargeDate.toISOString()).toBe(new Date('2025-01-15').toISOString());
    expect(charge.description).toBe('Dépôt de garantie');

    const savedCharges = chargeRepository.getAll();
    expect(savedCharges).toHaveLength(1);
  });

  it('should add a charge without description (optional)', async () => {
    const chargeData = {
      leaseId: 'lease-2',
      amount: 100,
      chargeDate: new Date('2025-02-01'),
    };

    const charge = await addCharge.execute(chargeData);

    expect(charge.id).toBeTruthy(); // ID is auto-generated
    expect(charge.description).toBeUndefined();

    const savedCharges = chargeRepository.getAll();
    expect(savedCharges).toHaveLength(1);
  });

  it('should throw error when amount is zero or negative', async () => {
    const chargeData = {
      leaseId: 'lease-3',
      amount: -50,
      chargeDate: new Date(),
    };

    await expect(addCharge.execute(chargeData)).rejects.toThrow();
  });

  it('should throw error when chargeDate is invalid', async () => {
    const chargeData = {
      leaseId: 'lease-4',
      amount: 100,
      chargeDate: new Date('invalid-date'),
    };

    await expect(addCharge.execute(chargeData)).rejects.toThrow();
  });
});
