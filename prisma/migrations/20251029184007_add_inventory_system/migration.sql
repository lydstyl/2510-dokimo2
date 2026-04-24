-- CreateTable
CREATE TABLE "InventoryTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InventoryTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "leaseId" TEXT,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inventory_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inventory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InventoryTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "aspect" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "comments" TEXT,
    "photoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryAssessment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InventoryTemplate_name_idx" ON "InventoryTemplate"("name");

-- CreateIndex
CREATE INDEX "InventoryTemplateItem_templateId_idx" ON "InventoryTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "InventoryTemplateItem_order_idx" ON "InventoryTemplateItem"("order");

-- CreateIndex
CREATE INDEX "Inventory_propertyId_idx" ON "Inventory"("propertyId");

-- CreateIndex
CREATE INDEX "Inventory_leaseId_idx" ON "Inventory"("leaseId");

-- CreateIndex
CREATE INDEX "Inventory_type_idx" ON "Inventory"("type");

-- CreateIndex
CREATE INDEX "Inventory_date_idx" ON "Inventory"("date");

-- CreateIndex
CREATE INDEX "InventoryAssessment_inventoryId_idx" ON "InventoryAssessment"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryAssessment_itemName_idx" ON "InventoryAssessment"("itemName");
