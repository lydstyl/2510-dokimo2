-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "documentPath" TEXT,
    "includedInCharges" BOOLEAN NOT NULL DEFAULT true,
    "waterConsumption" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialDocument_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyChargeShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyChargeShare_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "buildingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Property_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "city", "createdAt", "id", "landlordId", "name", "postalCode", "type", "updatedAt") SELECT "address", "city", "createdAt", "id", "landlordId", "name", "postalCode", "type", "updatedAt" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE INDEX "Property_landlordId_idx" ON "Property"("landlordId");
CREATE INDEX "Property_buildingId_idx" ON "Property"("buildingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Building_name_idx" ON "Building"("name");

-- CreateIndex
CREATE INDEX "FinancialDocument_buildingId_idx" ON "FinancialDocument"("buildingId");

-- CreateIndex
CREATE INDEX "FinancialDocument_category_idx" ON "FinancialDocument"("category");

-- CreateIndex
CREATE INDEX "FinancialDocument_date_idx" ON "FinancialDocument"("date");

-- CreateIndex
CREATE INDEX "FinancialDocument_includedInCharges_idx" ON "FinancialDocument"("includedInCharges");

-- CreateIndex
CREATE INDEX "PropertyChargeShare_propertyId_idx" ON "PropertyChargeShare"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyChargeShare_category_idx" ON "PropertyChargeShare"("category");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyChargeShare_propertyId_category_key" ON "PropertyChargeShare"("propertyId", "category");
