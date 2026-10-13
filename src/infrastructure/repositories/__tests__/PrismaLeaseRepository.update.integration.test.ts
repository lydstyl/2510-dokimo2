/**
 * Integration test for PrismaLeaseRepository.update().
 *
 * Regression test for the 13/10/2026 corruption: update() deleted EVERY
 * LeaseTenant row before re-creating them, and both statements ran outside of
 * any transaction. When the re-creation failed (unknown tenant id coming from
 * the composite ids returned by GET /api/leases/<id>), the deletion was NOT
 * rolled back: the lease stayed behind with zero tenant, which made every read
 * of that lease (and therefore every PATCH and every receipt generation) throw
 * "At least one tenant is required".
 *
 * This test runs against a throwaway SQLite file built from prisma/migrations.
 * It must NEVER open prisma/dev.db (development data) nor the production
 * database that lives inside the docker volume.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLeaseRepository } from '@/infrastructure/repositories/PrismaLeaseRepository';
import { UpdateLease } from '@/use-cases/UpdateLease';
import { Lease } from '@/domain/entities/Lease';
import { Money } from '@/domain/value-objects/Money';

const LEASE_ID = 'lease-integration-1';
const PROPERTY_ID = 'property-integration-1';
const LANDLORD_ID = 'landlord-integration-1';
const USER_ID = 'user-integration-1';
const TENANT_A = 'tenant-integration-a';
const TENANT_B = 'tenant-integration-b';
const TENANT_C = 'tenant-integration-c';
const UNKNOWN_TENANT = 'tenant-integration-unknown';

let tempDir: string;
let dbPath: string;
let prisma: PrismaClient;
let repository: PrismaLeaseRepository;

/** Build a fresh SQLite database (schema from the real migrations) outside the repo. */
function createTestDatabase(): { dir: string; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dokimo-lease-update-test-'));
  const file = path.join(dir, 'test.db');

  if (path.basename(file) === 'dev.db') {
    throw new Error('Refusing to run against a dev.db database');
  }

  const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((entry) => fs.existsSync(path.join(migrationsDir, entry, 'migration.sql')))
    .sort();

  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  for (const migration of migrations) {
    db.exec(fs.readFileSync(path.join(migrationsDir, migration, 'migration.sql'), 'utf8'));
  }
  db.close();

  return { dir, file };
}

/** Domain entity as the use case builds it before handing it to the repository. */
function buildLease(tenantIds: string[]): Lease {
  return Lease.create({
    id: LEASE_ID,
    propertyId: PROPERTY_ID,
    tenantIds,
    startDate: new Date('2025-01-01'),
    endDate: null,
    rentAmount: Money.create(620),
    chargesAmount: Money.create(60),
    paymentDueDay: 10,
    irlQuarter: 'T4',
    note: undefined,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
  });
}

async function currentTenantIds(): Promise<string[]> {
  const rows = await prisma.leaseTenant.findMany({
    where: { leaseId: LEASE_ID },
    orderBy: { tenantId: 'asc' },
  });
  return rows.map((row) => row.tenantId);
}

describe('PrismaLeaseRepository.update() — integration (SQLite)', () => {
  beforeAll(async () => {
    const created = createTestDatabase();
    tempDir = created.dir;
    dbPath = created.file;

    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma = new PrismaClient({ adapter } as any);
    await prisma.$connect();

    repository = new PrismaLeaseRepository(prisma);

    await prisma.user.create({
      data: { id: USER_ID, email: 'integration@dokimo.test', password: 'not-a-secret' },
    });
    await prisma.landlord.create({
      data: {
        id: LANDLORD_ID,
        name: 'Landlord integration',
        type: 'LEGAL_ENTITY',
        address: '1 rue du Test',
        userId: USER_ID,
      },
    });
    await prisma.property.create({
      data: {
        id: PROPERTY_ID,
        name: 'Appartement test',
        type: 'APARTMENT',
        address: '1 rue du Test',
        postalCode: '59192',
        city: 'Raismes',
        landlordId: LANDLORD_ID,
      },
    });
    for (const [index, tenantId] of [TENANT_A, TENANT_B, TENANT_C].entries()) {
      await prisma.tenant.create({
        data: { id: tenantId, firstName: `Tenant${index}`, lastName: 'Integration' },
      });
    }
    await prisma.lease.create({
      data: {
        id: LEASE_ID,
        propertyId: PROPERTY_ID,
        startDate: new Date('2025-01-01'),
        rentAmount: 600,
        chargesAmount: 50,
        paymentDueDay: 5,
      },
    });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Deterministic baseline: the lease always starts with exactly 2 tenants.
    await prisma.leaseTenant.deleteMany({ where: { leaseId: LEASE_ID } });
    await prisma.leaseTenant.createMany({
      data: [
        { id: `${LEASE_ID}_${TENANT_A}`, leaseId: LEASE_ID, tenantId: TENANT_A },
        { id: `${LEASE_ID}_${TENANT_B}`, leaseId: LEASE_ID, tenantId: TENANT_B },
      ],
    });
  });

  it('rejects an unknown tenant id with an explicit error', async () => {
    const error = await repository
      .update(buildLease([TENANT_A, TENANT_B, UNKNOWN_TENANT]))
      .catch((caught: Error) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(`Unknown tenant id: ${UNKNOWN_TENANT}`);
  });

  it('keeps the existing tenants after a rejected update (the corrupted-lease regression)', async () => {
    await repository.update(buildLease([TENANT_A, TENANT_B, UNKNOWN_TENANT])).catch(() => undefined);

    // Before the fix this read threw "At least one tenant is required".
    const reloaded = await repository.findById(LEASE_ID);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.tenantIds.slice().sort()).toEqual([TENANT_A, TENANT_B]);
    expect(await currentTenantIds()).toEqual([TENANT_A, TENANT_B]);
  });

  it('rejects the composite ids returned by GET /api/leases/<id> instead of wiping the lease', async () => {
    const compositeIds = [`${LEASE_ID}_${TENANT_A}`, `${LEASE_ID}_${TENANT_B}`];

    const error = await repository
      .update(buildLease(compositeIds))
      .catch((caught: Error) => caught);

    expect((error as Error).message).toBe(`Unknown tenant id: ${compositeIds.join(', ')}`);
    expect(await currentTenantIds()).toEqual([TENANT_A, TENANT_B]);
  });

  it('rolls back the tenant deletion when the re-creation fails (duplicate tenant id)', async () => {
    // The API route rejects duplicated tenantIds before they reach the repository;
    // this test calls the repository directly to prove the stronger property: ANY
    // failure happening AFTER the deletion is rolled back, whatever its cause.
    const error = await repository.update(buildLease([TENANT_A, TENANT_A])).catch((caught: Error) => caught);

    expect(error).toBeInstanceOf(Error);
    // The deletion ran before the failing insert: it must have been undone.
    expect(await currentTenantIds()).toEqual([TENANT_A, TENANT_B]);
    const reloaded = await repository.findById(LEASE_ID);
    expect(reloaded).not.toBeNull();
  });

  it('replaces the tenants on a valid update, without duplicates or leftover rows', async () => {
    const updated = await repository.update(buildLease([TENANT_A, TENANT_C]));

    expect(updated.tenantIds.slice().sort()).toEqual([TENANT_A, TENANT_C]);
    expect(updated.rentAmount.getValue()).toBe(620);

    const rows = await prisma.leaseTenant.findMany({ where: { leaseId: LEASE_ID } });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.tenantId).sort()).toEqual([TENANT_A, TENANT_C]);
    expect(await currentTenantIds()).toEqual([TENANT_A, TENANT_C]);
  });

  it('propagates the explicit error through the UpdateLease use case, leaving the lease intact', async () => {
    const useCase = new UpdateLease(repository);

    await expect(
      useCase.execute({
        id: LEASE_ID,
        propertyId: PROPERTY_ID,
        tenantIds: [TENANT_A, UNKNOWN_TENANT],
        startDate: new Date('2025-01-01'),
        endDate: null,
        rentAmount: 620,
        chargesAmount: 60,
        paymentDueDay: 10,
      })
    ).rejects.toThrow(`Unknown tenant id: ${UNKNOWN_TENANT}`);

    expect(await currentTenantIds()).toEqual([TENANT_A, TENANT_B]);
  });
});
