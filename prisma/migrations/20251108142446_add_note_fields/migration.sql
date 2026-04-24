/*
  Warnings:

  - You are about to drop the column `tenantId` on the `Lease` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN "note" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "note" TEXT;

-- CreateTable
CREATE TABLE "LeaseTenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaseTenant_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaseTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "rentAmount" REAL NOT NULL,
    "chargesAmount" REAL NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "irlQuarter" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lease" ("chargesAmount", "createdAt", "endDate", "id", "irlQuarter", "paymentDueDay", "propertyId", "rentAmount", "startDate", "updatedAt") SELECT "chargesAmount", "createdAt", "endDate", "id", "irlQuarter", "paymentDueDay", "propertyId", "rentAmount", "startDate", "updatedAt" FROM "Lease";
DROP TABLE "Lease";
ALTER TABLE "new_Lease" RENAME TO "Lease";
CREATE INDEX "Lease_propertyId_idx" ON "Lease"("propertyId");
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'NATURAL_PERSON',
    "civility" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "phone" TEXT,
    "siret" TEXT,
    "managerName" TEXT,
    "managerEmail" TEXT,
    "managerPhone" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tenant" ("civility", "createdAt", "email", "firstName", "id", "lastName", "phone", "updatedAt") SELECT "civility", "createdAt", "email", "firstName", "id", "lastName", "phone", "updatedAt" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LeaseTenant_leaseId_idx" ON "LeaseTenant"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseTenant_tenantId_idx" ON "LeaseTenant"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseTenant_leaseId_tenantId_key" ON "LeaseTenant"("leaseId", "tenantId");
