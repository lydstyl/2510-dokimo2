import { LeaseRentOverride } from '../../domain/LeaseRentOverride';

/**
 * Repository interface for LeaseRentOverride
 */
export interface ILeaseRentOverrideRepository {
  /**
   * Find an override by ID
   */
  findById(id: string): Promise<LeaseRentOverride | null>;

  /**
   * Find an override for a specific lease and month
   */
  findByLeaseIdAndMonth(leaseId: string, month: string): Promise<LeaseRentOverride | null>;

  /**
   * Find all overrides for a lease
   */
  findAllByLeaseId(leaseId: string): Promise<LeaseRentOverride[]>;

  /**
   * Create a new override
   */
  create(override: LeaseRentOverride): Promise<LeaseRentOverride>;

  /**
   * Update an existing override
   */
  update(override: LeaseRentOverride): Promise<LeaseRentOverride>;

  /**
   * Delete an override
   */
  delete(id: string): Promise<void>;
}
