/**
 * Migration script to update RentRevision statuses
 * PENDING -> EN_PREPARATION
 * DONE -> COURRIER_AR_ENVOYE
 * CANCELLED -> CANCELLED (no change)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting RentRevision status migration...');

  // Update PENDING to EN_PREPARATION
  const pendingResult = await prisma.rentRevision.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'EN_PREPARATION' },
  });
  console.log(`✓ Updated ${pendingResult.count} revisions from PENDING to EN_PREPARATION`);

  // Update DONE to COURRIER_AR_ENVOYE
  const doneResult = await prisma.rentRevision.updateMany({
    where: { status: 'DONE' },
    data: { status: 'COURRIER_AR_ENVOYE' },
  });
  console.log(`✓ Updated ${doneResult.count} revisions from DONE to COURRIER_AR_ENVOYE`);

  // Check final counts
  const enPreparation = await prisma.rentRevision.count({
    where: { status: 'EN_PREPARATION' },
  });
  const courrierEnvoye = await prisma.rentRevision.count({
    where: { status: 'COURRIER_AR_ENVOYE' },
  });
  const cancelled = await prisma.rentRevision.count({
    where: { status: 'CANCELLED' },
  });

  console.log('\nFinal counts:');
  console.log(`  EN_PREPARATION: ${enPreparation}`);
  console.log(`  COURRIER_AR_ENVOYE: ${courrierEnvoye}`);
  console.log(`  CANCELLED: ${cancelled}`);
  console.log('\nMigration completed successfully!');
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
