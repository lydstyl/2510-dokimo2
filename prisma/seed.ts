import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const email = process.env.AUTH_EMAIL || 'lydstyl@gmail.com';
  const password = process.env.AUTH_PASSWORD || 'papass';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id: 'user-1',
      email,
      password: hashedPassword,
    },
  });

  console.log('Created user:', user);

  // Create a landlord (natural person)
  const landlord1 = await prisma.landlord.upsert({
    where: { id: 'landlord-1' },
    update: {},
    create: {
      id: 'landlord-1',
      name: 'Jean Dupont',
      type: 'NATURAL_PERSON',
      address: '10 Rue de la Paix, 75002 Paris',
      email: 'jean.dupont@example.com',
      phone: '+33 1 23 45 67 89',
      userId: user.id,
    },
  });

  console.log('Created landlord 1:', landlord1);

  // Create a landlord (legal entity)
  const landlord2 = await prisma.landlord.upsert({
    where: { id: 'landlord-2' },
    update: {},
    create: {
      id: 'landlord-2',
      name: 'SCI Immobilière',
      type: 'LEGAL_ENTITY',
      address: '25 Avenue des Champs-Élysées, 75008 Paris',
      email: 'contact@sci-immo.fr',
      phone: '+33 1 98 76 54 32',
      siret: '12345678900012',
      userId: user.id,
    },
  });

  console.log('Created landlord 2:', landlord2);

  // Create properties
  const property1 = await prisma.property.upsert({
    where: { id: 'property-1' },
    update: {},
    create: {
      id: 'property-1',
      name: 'Appartement T3 - Marais',
      type: 'APARTMENT',
      address: '15 Rue des Rosiers',
      postalCode: '75004',
      city: 'Paris',
      landlordId: landlord1.id,
    },
  });

  console.log('Created property 1:', property1);

  const property2 = await prisma.property.upsert({
    where: { id: 'property-2' },
    update: {},
    create: {
      id: 'property-2',
      name: 'Studio - Montmartre',
      type: 'APARTMENT',
      address: '8 Rue Lepic',
      postalCode: '75018',
      city: 'Paris',
      landlordId: landlord2.id,
    },
  });

  console.log('Created property 2:', property2);

  const property3 = await prisma.property.upsert({
    where: { id: 'property-3' },
    update: {},
    create: {
      id: 'property-3',
      name: 'Maison - Versailles',
      type: 'HOUSE',
      address: '42 Avenue de Paris',
      postalCode: '78000',
      city: 'Versailles',
      landlordId: landlord1.id,
    },
  });

  console.log('Created property 3:', property3);

  // Create tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+33 6 12 34 56 78',
    },
  });

  console.log('Created tenant 1 (Paid Enough):', tenant1);

  const tenant2 = await prisma.tenant.upsert({
    where: { id: 'tenant-2' },
    update: {},
    create: {
      id: 'tenant-2',
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@example.com',
      phone: '+33 6 98 76 54 32',
    },
  });

  console.log('Created tenant 2 (Underpaid):', tenant2);

  const tenant3 = await prisma.tenant.upsert({
    where: { id: 'tenant-3' },
    update: {},
    create: {
      id: 'tenant-3',
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie.dubois@example.com',
      phone: '+33 6 55 44 33 22',
    },
  });

  console.log('Created tenant 3 (Overpaid):', tenant3);

  // Create leases
  // Lease 1: Tenant who paid enough (10 months, all paid)
  const lease1 = await prisma.lease.upsert({
    where: { id: 'lease-1' },
    update: {},
    create: {
      id: 'lease-1',
      propertyId: property1.id,
      tenantId: tenant1.id,
      startDate: new Date('2024-01-01'),
      rentAmount: 1200,
      chargesAmount: 150,
      paymentDueDay: 5,
    },
  });

  console.log('Created lease 1:', lease1);

  // Lease 2: Tenant who underpaid (8 months, only 5 payments)
  const lease2 = await prisma.lease.upsert({
    where: { id: 'lease-2' },
    update: {},
    create: {
      id: 'lease-2',
      propertyId: property2.id,
      tenantId: tenant2.id,
      startDate: new Date('2024-03-01'),
      rentAmount: 800,
      chargesAmount: 80,
      paymentDueDay: 1,
    },
  });

  console.log('Created lease 2:', lease2);

  // Lease 3: Tenant who overpaid (6 months, 8 payments)
  const lease3 = await prisma.lease.upsert({
    where: { id: 'lease-3' },
    update: {},
    create: {
      id: 'lease-3',
      propertyId: property3.id,
      tenantId: tenant3.id,
      startDate: new Date('2024-05-01'),
      rentAmount: 1000,
      chargesAmount: 100,
      paymentDueDay: 10,
    },
  });

  console.log('Created lease 3:', lease3);

  // Payments for Lease 1 (Paid Enough - 10 months, 10 payments)
  const monthlyAmount1 = 1350; // 1200 + 150
  for (let i = 0; i < 10; i++) {
    await prisma.payment.upsert({
      where: { id: `payment-1-${i + 1}` },
      update: {},
      create: {
        id: `payment-1-${i + 1}`,
        leaseId: lease1.id,
        amount: monthlyAmount1,
        paymentDate: new Date(2024, i, 5),
        notes: `Payment for month ${i + 1}`,
      },
    });
  }
  console.log('Created 10 payments for lease 1 (Paid Enough)');

  // Payments for Lease 2 (Underpaid - 8 months, only 5 payments)
  const monthlyAmount2 = 880; // 800 + 80
  for (let i = 0; i < 5; i++) {
    await prisma.payment.upsert({
      where: { id: `payment-2-${i + 1}` },
      update: {},
      create: {
        id: `payment-2-${i + 1}`,
        leaseId: lease2.id,
        amount: monthlyAmount2,
        paymentDate: new Date(2024, 2 + i, 1), // Starting from March (month 2)
        notes: `Payment for month ${i + 1}`,
      },
    });
  }
  console.log('Created 5 payments for lease 2 (Underpaid - owes 3 months)');

  // Payments for Lease 3 (Overpaid - 6 months, 8 payments)
  const monthlyAmount3 = 1100; // 1000 + 100
  for (let i = 0; i < 8; i++) {
    await prisma.payment.upsert({
      where: { id: `payment-3-${i + 1}` },
      update: {},
      create: {
        id: `payment-3-${i + 1}`,
        leaseId: lease3.id,
        amount: monthlyAmount3,
        paymentDate: new Date(2024, 4 + i, 10), // Starting from May (month 4)
        notes: `Payment for month ${i + 1}`,
      },
    });
  }
  console.log('Created 8 payments for lease 3 (Overpaid - 2 months ahead)');

  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
