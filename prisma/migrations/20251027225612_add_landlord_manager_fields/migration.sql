/*
  Warnings:

  - You are about to drop the column `periodEnd` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN "managerEmail" TEXT;
ALTER TABLE "Landlord" ADD COLUMN "managerName" TEXT;
ALTER TABLE "Landlord" ADD COLUMN "managerPhone" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "id", "leaseId", "notes", "paymentDate", "updatedAt") SELECT "amount", "createdAt", "id", "leaseId", "notes", "paymentDate", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_leaseId_idx" ON "Payment"("leaseId");
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
