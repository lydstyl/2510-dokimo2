-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RentRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "rentAmount" REAL NOT NULL,
    "chargesAmount" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EN_PREPARATION',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentRevision_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RentRevision" ("chargesAmount", "createdAt", "effectiveDate", "id", "leaseId", "reason", "rentAmount", "status", "updatedAt") SELECT "chargesAmount", "createdAt", "effectiveDate", "id", "leaseId", "reason", "rentAmount", "status", "updatedAt" FROM "RentRevision";
DROP TABLE "RentRevision";
ALTER TABLE "new_RentRevision" RENAME TO "RentRevision";
CREATE INDEX "RentRevision_leaseId_idx" ON "RentRevision"("leaseId");
CREATE INDEX "RentRevision_effectiveDate_idx" ON "RentRevision"("effectiveDate");
CREATE INDEX "RentRevision_status_idx" ON "RentRevision"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
