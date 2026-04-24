-- CreateTable
CREATE TABLE "PropertyDiagnostic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosticDate" DATETIME NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyDiagnostic_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PropertyDiagnostic_propertyId_idx" ON "PropertyDiagnostic"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyDiagnostic_expiryDate_idx" ON "PropertyDiagnostic"("expiryDate");
