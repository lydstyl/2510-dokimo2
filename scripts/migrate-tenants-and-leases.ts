/**
 * Migration script to add support for:
 * 1. Legal entity tenants with manager information
 * 2. Multiple tenants per lease
 *
 * This script should be run once to migrate existing data.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');

  // Step 1: Get all existing leases with their tenant relationships
  const existingLeases = await prisma.lease.findMany({
    select: {
      id: true,
      tenantId: true,
    },
  });

  console.log(`Found ${existingLeases.length} leases to migrate`);

  // Step 2: For each lease, create a LeaseTenant entry
  for (const lease of existingLeases) {
    if (lease.tenantId) {
      try {
        await prisma.leaseTenant.create({
          data: {
            leaseId: lease.id,
            tenantId: lease.tenantId,
          },
        });
        console.log(`✓ Migrated lease ${lease.id}`);
      } catch (error) {
        console.error(`✗ Failed to migrate lease ${lease.id}:`, error);
      }
    }
  }

  console.log('Migration completed!');
  console.log('You can now remove the tenantId column from the Lease model in your Prisma schema.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
