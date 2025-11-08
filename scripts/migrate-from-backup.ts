import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();

async function main() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error('Usage: tsx scripts/migrate-from-backup.ts <backup-file>');
    console.error('Example: tsx scripts/migrate-from-backup.ts prisma/dev.db.backup.20251108_151403');
    process.exit(1);
  }

  console.log(`🔄 Starting migration from ${backupFile}...`);
  console.log('');

  // Open the old database
  const oldDb = new Database(backupFile, { readonly: true });

  try {
    // 1. Migrate Users
    console.log('📦 Migrating Users...');
    const users = oldDb.prepare('SELECT * FROM User').all() as any[];
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          password: user.password,
          updatedAt: new Date(user.updatedAt),
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${users.length} users migrated`);

    // 2. Migrate Landlords
    console.log('📦 Migrating Landlords...');
    const landlords = oldDb.prepare('SELECT * FROM Landlord').all() as any[];
    for (const landlord of landlords) {
      await prisma.landlord.upsert({
        where: { id: landlord.id },
        update: {
          name: landlord.name,
          type: landlord.type,
          address: landlord.address,
          email: landlord.email,
          phone: landlord.phone,
          siret: landlord.siret,
          managerName: landlord.managerName,
          managerEmail: landlord.managerEmail,
          managerPhone: landlord.managerPhone,
          note: null, // New field, set to null
          updatedAt: new Date(landlord.updatedAt),
        },
        create: {
          id: landlord.id,
          name: landlord.name,
          type: landlord.type,
          address: landlord.address,
          email: landlord.email,
          phone: landlord.phone,
          siret: landlord.siret,
          managerName: landlord.managerName,
          managerEmail: landlord.managerEmail,
          managerPhone: landlord.managerPhone,
          note: null, // New field
          userId: landlord.userId,
          createdAt: new Date(landlord.createdAt),
          updatedAt: new Date(landlord.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${landlords.length} landlords migrated`);

    // 3. Migrate Buildings
    console.log('📦 Migrating Buildings...');
    const buildings = oldDb.prepare('SELECT * FROM Building').all() as any[];
    for (const building of buildings) {
      await prisma.building.upsert({
        where: { id: building.id },
        update: {
          name: building.name,
          address: building.address,
          postalCode: building.postalCode,
          city: building.city,
          updatedAt: new Date(building.updatedAt),
        },
        create: {
          id: building.id,
          name: building.name,
          address: building.address,
          postalCode: building.postalCode,
          city: building.city,
          createdAt: new Date(building.createdAt),
          updatedAt: new Date(building.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${buildings.length} buildings migrated`);

    // 4. Migrate Properties
    console.log('📦 Migrating Properties...');
    const properties = oldDb.prepare('SELECT * FROM Property').all() as any[];
    for (const property of properties) {
      await prisma.property.upsert({
        where: { id: property.id },
        update: {
          name: property.name,
          type: property.type,
          address: property.address,
          postalCode: property.postalCode,
          city: property.city,
          note: null, // New field
          buildingId: property.buildingId,
          updatedAt: new Date(property.updatedAt),
        },
        create: {
          id: property.id,
          name: property.name,
          type: property.type,
          address: property.address,
          postalCode: property.postalCode,
          city: property.city,
          note: null, // New field
          landlordId: property.landlordId,
          buildingId: property.buildingId,
          createdAt: new Date(property.createdAt),
          updatedAt: new Date(property.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${properties.length} properties migrated`);

    // 5. Migrate Tenants
    console.log('📦 Migrating Tenants...');
    const tenants = oldDb.prepare('SELECT * FROM Tenant').all() as any[];
    for (const tenant of tenants) {
      await prisma.tenant.upsert({
        where: { id: tenant.id },
        update: {
          type: tenant.type,
          civility: tenant.civility,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          phone: tenant.phone,
          siret: tenant.siret,
          managerName: tenant.managerName,
          managerEmail: tenant.managerEmail,
          managerPhone: tenant.managerPhone,
          note: null, // New field
          updatedAt: new Date(tenant.updatedAt),
        },
        create: {
          id: tenant.id,
          type: tenant.type,
          civility: tenant.civility,
          firstName: tenant.firstName,
          lastName: tenant.lastName || '',
          email: tenant.email,
          phone: tenant.phone,
          siret: tenant.siret,
          managerName: tenant.managerName,
          managerEmail: tenant.managerEmail,
          managerPhone: tenant.managerPhone,
          note: null, // New field
          createdAt: new Date(tenant.createdAt),
          updatedAt: new Date(tenant.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${tenants.length} tenants migrated`);

    // 6. Migrate Leases
    console.log('📦 Migrating Leases...');
    const leases = oldDb.prepare('SELECT * FROM Lease').all() as any[];
    for (const lease of leases) {
      await prisma.lease.upsert({
        where: { id: lease.id },
        update: {
          startDate: new Date(lease.startDate),
          endDate: lease.endDate ? new Date(lease.endDate) : null,
          rentAmount: lease.rentAmount,
          chargesAmount: lease.chargesAmount,
          paymentDueDay: lease.paymentDueDay,
          irlQuarter: lease.irlQuarter,
          note: null, // New field
          updatedAt: new Date(lease.updatedAt),
        },
        create: {
          id: lease.id,
          propertyId: lease.propertyId,
          startDate: new Date(lease.startDate),
          endDate: lease.endDate ? new Date(lease.endDate) : null,
          rentAmount: lease.rentAmount,
          chargesAmount: lease.chargesAmount,
          paymentDueDay: lease.paymentDueDay,
          irlQuarter: lease.irlQuarter,
          note: null, // New field
          createdAt: new Date(lease.createdAt),
          updatedAt: new Date(lease.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${leases.length} leases migrated`);

    // 7. Migrate LeaseTenants
    console.log('📦 Migrating Lease-Tenant relationships...');
    const leaseTenants = oldDb.prepare('SELECT * FROM LeaseTenant').all() as any[];
    for (const lt of leaseTenants) {
      await prisma.leaseTenant.upsert({
        where: { id: lt.id },
        update: {},
        create: {
          id: lt.id,
          leaseId: lt.leaseId,
          tenantId: lt.tenantId,
          createdAt: new Date(lt.createdAt),
        },
      });
    }
    console.log(`   ✅ ${leaseTenants.length} lease-tenant relationships migrated`);

    // 8. Migrate Payments
    console.log('📦 Migrating Payments...');
    const payments = oldDb.prepare('SELECT * FROM Payment').all() as any[];
    for (const payment of payments) {
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: {
          amount: payment.amount,
          paymentDate: new Date(payment.paymentDate),
          notes: payment.notes,
          updatedAt: new Date(payment.updatedAt),
        },
        create: {
          id: payment.id,
          leaseId: payment.leaseId,
          amount: payment.amount,
          paymentDate: new Date(payment.paymentDate),
          notes: payment.notes,
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${payments.length} payments migrated`);

    // 9. Migrate RentRevisions
    console.log('📦 Migrating Rent Revisions...');
    const rentRevisions = oldDb.prepare('SELECT * FROM RentRevision').all() as any[];
    for (const revision of rentRevisions) {
      await prisma.rentRevision.upsert({
        where: { id: revision.id },
        update: {
          effectiveDate: new Date(revision.effectiveDate),
          rentAmount: revision.rentAmount,
          chargesAmount: revision.chargesAmount,
          reason: revision.reason,
        },
        create: {
          id: revision.id,
          leaseId: revision.leaseId,
          effectiveDate: new Date(revision.effectiveDate),
          rentAmount: revision.rentAmount,
          chargesAmount: revision.chargesAmount,
          reason: revision.reason,
          createdAt: new Date(revision.createdAt),
        },
      });
    }
    console.log(`   ✅ ${rentRevisions.length} rent revisions migrated`);

    // 10. Migrate Boilers
    console.log('📦 Migrating Boilers...');
    const boilers = oldDb.prepare('SELECT * FROM Boiler').all() as any[];
    for (const boiler of boilers) {
      await prisma.boiler.upsert({
        where: { id: boiler.id },
        update: {
          name: boiler.name,
          notes: boiler.notes,
          updatedAt: new Date(boiler.updatedAt),
        },
        create: {
          id: boiler.id,
          propertyId: boiler.propertyId,
          name: boiler.name,
          notes: boiler.notes,
          createdAt: new Date(boiler.createdAt),
          updatedAt: new Date(boiler.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${boilers.length} boilers migrated`);

    // 11. Migrate Boiler Maintenances
    console.log('📦 Migrating Boiler Maintenances...');
    const maintenances = oldDb.prepare('SELECT * FROM BoilerMaintenance').all() as any[];
    for (const maintenance of maintenances) {
      await prisma.boilerMaintenance.upsert({
        where: { id: maintenance.id },
        update: {
          maintenanceDate: new Date(maintenance.maintenanceDate),
          documentPath: maintenance.documentPath,
          updatedAt: new Date(maintenance.updatedAt),
        },
        create: {
          id: maintenance.id,
          boilerId: maintenance.boilerId,
          maintenanceDate: new Date(maintenance.maintenanceDate),
          documentPath: maintenance.documentPath,
          createdAt: new Date(maintenance.createdAt),
          updatedAt: new Date(maintenance.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${maintenances.length} boiler maintenances migrated`);

    // 12. Migrate Financial Documents
    console.log('📦 Migrating Financial Documents...');
    const financialDocs = oldDb.prepare('SELECT * FROM FinancialDocument').all() as any[];
    for (const doc of financialDocs) {
      await prisma.financialDocument.upsert({
        where: { id: doc.id },
        update: {
          category: doc.category,
          date: new Date(doc.date),
          amount: doc.amount,
          description: doc.description,
          documentPath: doc.documentPath,
          includedInCharges: doc.includedInCharges === 1,
          waterConsumption: doc.waterConsumption,
          updatedAt: new Date(doc.updatedAt),
        },
        create: {
          id: doc.id,
          buildingId: doc.buildingId,
          category: doc.category,
          date: new Date(doc.date),
          amount: doc.amount,
          description: doc.description,
          documentPath: doc.documentPath,
          includedInCharges: doc.includedInCharges === 1,
          waterConsumption: doc.waterConsumption,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${financialDocs.length} financial documents migrated`);

    // 13. Migrate Property Charge Shares
    console.log('📦 Migrating Property Charge Shares...');
    const chargeShares = oldDb.prepare('SELECT * FROM PropertyChargeShare').all() as any[];
    for (const share of chargeShares) {
      await prisma.propertyChargeShare.upsert({
        where: { id: share.id },
        update: {
          category: share.category,
          percentage: share.percentage,
          updatedAt: new Date(share.updatedAt),
        },
        create: {
          id: share.id,
          propertyId: share.propertyId,
          category: share.category,
          percentage: share.percentage,
          createdAt: new Date(share.createdAt),
          updatedAt: new Date(share.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${chargeShares.length} property charge shares migrated`);

    // 14. Migrate Inventory Templates
    console.log('📦 Migrating Inventory Templates...');
    const templates = oldDb.prepare('SELECT * FROM InventoryTemplate').all() as any[];
    for (const template of templates) {
      await prisma.inventoryTemplate.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          description: template.description,
          updatedAt: new Date(template.updatedAt),
        },
        create: {
          id: template.id,
          name: template.name,
          description: template.description,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${templates.length} inventory templates migrated`);

    // 15. Migrate Inventory Template Items
    console.log('📦 Migrating Inventory Template Items...');
    const templateItems = oldDb.prepare('SELECT * FROM InventoryTemplateItem').all() as any[];
    for (const item of templateItems) {
      await prisma.inventoryTemplateItem.upsert({
        where: { id: item.id },
        update: {
          type: item.type,
          name: item.name,
          order: item.order,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          templateId: item.templateId,
          type: item.type,
          name: item.name,
          order: item.order,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }
    console.log(`   ✅ ${templateItems.length} inventory template items migrated`);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Landlords: ${landlords.length}`);
    console.log(`   Buildings: ${buildings.length}`);
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Tenants: ${tenants.length}`);
    console.log(`   Leases: ${leases.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Rent Revisions: ${rentRevisions.length}`);
    console.log(`   Boilers: ${boilers.length}`);
    console.log(`   Boiler Maintenances: ${maintenances.length}`);
    console.log(`   Financial Documents: ${financialDocs.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    oldDb.close();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
