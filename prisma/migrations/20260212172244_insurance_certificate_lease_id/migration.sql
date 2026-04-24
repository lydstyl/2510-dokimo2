/*
  Warnings:

  - You are about to drop the column `propertyId` on the `InsuranceCertificate` table. All the data in the column will be lost.
  - Added the required column `leaseId` to the `InsuranceCertificate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InsuranceCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "documentPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceCertificate_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InsuranceCertificate" ("createdAt", "documentPath", "endDate", "id", "startDate", "updatedAt") SELECT "createdAt", "documentPath", "endDate", "id", "startDate", "updatedAt" FROM "InsuranceCertificate";
DROP TABLE "InsuranceCertificate";
ALTER TABLE "new_InsuranceCertificate" RENAME TO "InsuranceCertificate";
CREATE INDEX "InsuranceCertificate_leaseId_idx" ON "InsuranceCertificate"("leaseId");
CREATE INDEX "InsuranceCertificate_startDate_idx" ON "InsuranceCertificate"("startDate");
CREATE INDEX "InsuranceCertificate_endDate_idx" ON "InsuranceCertificate"("endDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
