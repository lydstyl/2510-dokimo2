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

  console.log('Created tenant 1:', tenant1);

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

  console.log('Created tenant 2:', tenant2);

  // Create leases
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

  // Create sample payments
  const payment1 = await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      leaseId: lease1.id,
      amount: 1350,
      paymentDate: new Date('2024-01-05'),
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      type: 'FULL',
      notes: 'Payment for January 2024',
    },
  });

  console.log('Created payment 1:', payment1);

  const payment2 = await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
      leaseId: lease1.id,
      amount: 1350,
      paymentDate: new Date('2024-02-05'),
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      type: 'FULL',
      notes: 'Payment for February 2024',
    },
  });

  console.log('Created payment 2:', payment2);

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
