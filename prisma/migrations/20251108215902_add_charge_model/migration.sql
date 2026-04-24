-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "chargeDate" DATETIME NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Charge_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Charge_leaseId_idx" ON "Charge"("leaseId");

-- CreateIndex
CREATE INDEX "Charge_chargeDate_idx" ON "Charge"("chargeDate");
