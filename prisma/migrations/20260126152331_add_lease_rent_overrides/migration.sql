-- CreateTable
CREATE TABLE "LeaseRentOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "rentAmount" REAL NOT NULL,
    "chargesAmount" REAL NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaseRentOverride_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LeaseRentOverride_leaseId_idx" ON "LeaseRentOverride"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseRentOverride_month_idx" ON "LeaseRentOverride"("month");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseRentOverride_leaseId_month_key" ON "LeaseRentOverride"("leaseId", "month");
