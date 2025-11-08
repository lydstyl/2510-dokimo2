-- Migration script for tenant legal entity and multiple tenants per lease support
-- Step 1: Add new columns to Tenant table (if they don't exist)
ALTER TABLE Tenant ADD COLUMN type TEXT DEFAULT 'NATURAL_PERSON';
ALTER TABLE Tenant ADD COLUMN siret TEXT;
ALTER TABLE Tenant ADD COLUMN managerName TEXT;
ALTER TABLE Tenant ADD COLUMN managerEmail TEXT;
ALTER TABLE Tenant ADD COLUMN managerPhone TEXT;

-- Step 2: Create LeaseTenant junction table
CREATE TABLE IF NOT EXISTS LeaseTenant (
  id TEXT PRIMARY KEY,
  leaseId TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leaseId) REFERENCES Lease(id) ON DELETE CASCADE,
  FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE,
  UNIQUE(leaseId, tenantId)
);

CREATE INDEX IF NOT EXISTS LeaseTenant_leaseId_idx ON LeaseTenant(leaseId);
CREATE INDEX IF NOT EXISTS LeaseTenant_tenantId_idx ON LeaseTenant(tenantId);

-- Step 3: Migrate existing lease-tenant relationships to junction table
INSERT INTO LeaseTenant (id, leaseId, tenantId, createdAt)
SELECT
  lower(hex(randomblob(16))),
  id as leaseId,
  tenantId,
  CURRENT_TIMESTAMP
FROM Lease
WHERE tenantId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM LeaseTenant lt
    WHERE lt.leaseId = Lease.id AND lt.tenantId = Lease.tenantId
  );
