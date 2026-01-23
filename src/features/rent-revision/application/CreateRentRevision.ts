import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { RentRevision, RentRevisionStatus } from '../domain/RentRevision';
import { Money } from '@/domain/value-objects/Money';
import { randomUUID } from 'crypto';

/**
 * DTO for creating a rent revision
 */
export interface CreateRentRevisionDto {
  leaseId: string;
  effectiveDate: Date;
  rentAmount: number;
  chargesAmount: number;
  reason?: string;
}

/**
 * Use case: Create a new rent revision
 */
export class CreateRentRevision {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(dto: CreateRentRevisionDto): Promise<RentRevision> {
    // Create Money value objects (validates non-negative amounts)
    const rentAmount = Money.create(dto.rentAmount);
    const chargesAmount = Money.create(dto.chargesAmount);

    // Create RentRevision entity (validates business rules)
    const revision = RentRevision.create({
      id: randomUUID(),
      leaseId: dto.leaseId,
      effectiveDate: dto.effectiveDate,
      rentAmount,
      chargesAmount,
      reason: dto.reason,
      status: RentRevisionStatus.EN_PREPARATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist to repository
    return await this.repository.create(revision);
  }
}
