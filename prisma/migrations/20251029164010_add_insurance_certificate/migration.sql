-- CreateTable
CREATE TABLE "InsuranceCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "documentPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceCertificate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InsuranceCertificate_propertyId_idx" ON "InsuranceCertificate"("propertyId");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_startDate_idx" ON "InsuranceCertificate"("startDate");

-- CreateIndex
CREATE INDEX "InsuranceCertificate_endDate_idx" ON "InsuranceCertificate"("endDate");
