-- CreateTable
CREATE TABLE "WaterMeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "readingDate" DATETIME NOT NULL,
    "meterReading" REAL NOT NULL,
    "documentPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaterMeterReading_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WaterMeterReading_propertyId_idx" ON "WaterMeterReading"("propertyId");

-- CreateIndex
CREATE INDEX "WaterMeterReading_readingDate_idx" ON "WaterMeterReading"("readingDate");
