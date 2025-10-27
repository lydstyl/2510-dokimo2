import { RentRevision } from '@/domain/entities/RentRevision';

export interface IRentRevisionRepository {
  findByLeaseId(leaseId: string): Promise<RentRevision[]>;
  findByLeaseIdOrderedByDate(leaseId: string): Promise<RentRevision[]>;
  create(revision: RentRevision): Promise<RentRevision>;
  findById(id: string): Promise<RentRevision | null>;
}
