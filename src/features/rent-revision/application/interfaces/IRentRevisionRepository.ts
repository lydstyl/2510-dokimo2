import { RentRevision, RentRevisionStatus } from '../../domain/RentRevision';

/**
 * Repository interface for RentRevision
 * Follows Clean Architecture - application layer depends on this interface,
 * infrastructure layer implements it
 */
export interface IRentRevisionRepository {
  /**
   * Find a rent revision by ID
   */
  findById(id: string): Promise<RentRevision | null>;

  /**
   * Find all rent revisions for a specific lease
   */
  findByLeaseId(leaseId: string): Promise<RentRevision[]>;

  /**
   * Find rent revisions by status
   */
  findByStatus(status: RentRevisionStatus): Promise<RentRevision[]>;

  /**
   * Find all rent revisions
   */
  findAll(): Promise<RentRevision[]>;

  /**
   * Find urgent revisions (effective date within 2 months and status PENDING)
   */
  findUrgent(): Promise<RentRevision[]>;

  /**
   * Create a new rent revision
   */
  create(revision: RentRevision): Promise<RentRevision>;

  /**
   * Update an existing rent revision
   */
  update(revision: RentRevision): Promise<RentRevision>;

  /**
   * Delete a rent revision
   */
  delete(id: string): Promise<void>;
}
