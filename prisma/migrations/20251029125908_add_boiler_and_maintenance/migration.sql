-- CreateTable
CREATE TABLE "Boiler" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Boiler_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoilerMaintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boilerId" TEXT NOT NULL,
    "maintenanceDate" DATETIME NOT NULL,
    "documentPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BoilerMaintenance_boilerId_fkey" FOREIGN KEY ("boilerId") REFERENCES "Boiler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Boiler_propertyId_idx" ON "Boiler"("propertyId");

-- CreateIndex
CREATE INDEX "BoilerMaintenance_boilerId_idx" ON "BoilerMaintenance"("boilerId");

-- CreateIndex
CREATE INDEX "BoilerMaintenance_maintenanceDate_idx" ON "BoilerMaintenance"("maintenanceDate");
