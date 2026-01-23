import { PrismaClient } from '@prisma/client';
import { IRentRevisionRepository } from '../application/interfaces/IRentRevisionRepository';
import { RentRevision, RentRevisionStatus } from '../domain/RentRevision';
import { Money } from '@/domain/value-objects/Money';

/**
 * Prisma implementation of IRentRevisionRepository
 * Converts between Prisma models and domain entities
 */
export class PrismaRentRevisionRepository implements IRentRevisionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<RentRevision | null> {
    const prismaRevision = await this.prisma.rentRevision.findUnique({
      where: { id },
    });

    if (!prismaRevision) {
      return null;
    }

    return this.toDomain(prismaRevision);
  }

  async findByLeaseId(leaseId: string): Promise<RentRevision[]> {
    const prismaRevisions = await this.prisma.rentRevision.findMany({
      where: { leaseId },
      orderBy: { effectiveDate: 'desc' },
    });

    return prismaRevisions.map((pr) => this.toDomain(pr));
  }

  async findByStatus(status: RentRevisionStatus): Promise<RentRevision[]> {
    const prismaRevisions = await this.prisma.rentRevision.findMany({
      where: { status },
      orderBy: { effectiveDate: 'asc' },
    });

    return prismaRevisions.map((pr) => this.toDomain(pr));
  }

  async findAll(): Promise<RentRevision[]> {
    const prismaRevisions = await this.prisma.rentRevision.findMany({
      orderBy: { effectiveDate: 'desc' },
    });

    return prismaRevisions.map((pr) => this.toDomain(pr));
  }

  async findUrgent(): Promise<RentRevision[]> {
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    const prismaRevisions = await this.prisma.rentRevision.findMany({
      where: {
        status: RentRevisionStatus.EN_PREPARATION,
        effectiveDate: {
          gte: today,
          lte: twoMonthsFromNow,
        },
      },
      orderBy: { effectiveDate: 'asc' },
    });

    return prismaRevisions.map((pr) => this.toDomain(pr));
  }

  async create(revision: RentRevision): Promise<RentRevision> {
    const prismaRevision = await this.prisma.rentRevision.create({
      data: {
        id: revision.id,
        leaseId: revision.leaseId,
        effectiveDate: revision.effectiveDate,
        rentAmount: revision.rentAmount.getValue(),
        chargesAmount: revision.chargesAmount.getValue(),
        reason: revision.reason,
        status: revision.status,
        createdAt: revision.createdAt,
        updatedAt: revision.updatedAt,
      },
    });

    return this.toDomain(prismaRevision);
  }

  async update(revision: RentRevision): Promise<RentRevision> {
    const prismaRevision = await this.prisma.rentRevision.update({
      where: { id: revision.id },
      data: {
        effectiveDate: revision.effectiveDate,
        rentAmount: revision.rentAmount.getValue(),
        chargesAmount: revision.chargesAmount.getValue(),
        reason: revision.reason,
        status: revision.status,
        updatedAt: revision.updatedAt,
      },
    });

    return this.toDomain(prismaRevision);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rentRevision.delete({
      where: { id },
    });
  }

  /**
   * Convert Prisma model to domain entity
   * Uses reconstitute() to allow past dates for existing revisions
   */
  private toDomain(prismaRevision: any): RentRevision {
    return RentRevision.reconstitute({
      id: prismaRevision.id,
      leaseId: prismaRevision.leaseId,
      effectiveDate: new Date(prismaRevision.effectiveDate),
      rentAmount: Money.create(prismaRevision.rentAmount),
      chargesAmount: Money.create(prismaRevision.chargesAmount),
      reason: prismaRevision.reason,
      status: prismaRevision.status as RentRevisionStatus,
      createdAt: new Date(prismaRevision.createdAt),
      updatedAt: new Date(prismaRevision.updatedAt),
    });
  }
}
