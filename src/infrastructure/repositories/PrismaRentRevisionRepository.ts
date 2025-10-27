import { PrismaClient } from '@prisma/client';
import { RentRevision } from '@/domain/entities/RentRevision';
import { Money } from '@/domain/value-objects/Money';
import { IRentRevisionRepository } from '@/use-cases/interfaces/IRentRevisionRepository';

export class PrismaRentRevisionRepository implements IRentRevisionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByLeaseId(leaseId: string): Promise<RentRevision[]> {
    const revisions = await this.prisma.rentRevision.findMany({
      where: { leaseId },
    });

    return revisions.map(this.toDomain);
  }

  async findByLeaseIdOrderedByDate(leaseId: string): Promise<RentRevision[]> {
    const revisions = await this.prisma.rentRevision.findMany({
      where: { leaseId },
      orderBy: { effectiveDate: 'asc' },
    });

    return revisions.map(this.toDomain);
  }

  async create(revision: RentRevision): Promise<RentRevision> {
    const created = await this.prisma.rentRevision.create({
      data: {
        id: revision.id,
        leaseId: revision.leaseId,
        effectiveDate: revision.effectiveDate,
        rentAmount: revision.rentAmount.getValue(),
        chargesAmount: revision.chargesAmount.getValue(),
        reason: revision.reason,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<RentRevision | null> {
    const revision = await this.prisma.rentRevision.findUnique({
      where: { id },
    });

    return revision ? this.toDomain(revision) : null;
  }

  private toDomain(prismaRevision: any): RentRevision {
    return RentRevision.create({
      id: prismaRevision.id,
      leaseId: prismaRevision.leaseId,
      effectiveDate: prismaRevision.effectiveDate,
      rentAmount: Money.create(prismaRevision.rentAmount),
      chargesAmount: Money.create(prismaRevision.chargesAmount),
      reason: prismaRevision.reason || undefined,
      createdAt: prismaRevision.createdAt,
    });
  }
}
