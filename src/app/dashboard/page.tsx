import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { getTranslations } from 'next-intl/server';
import { DashboardCardWithBadge } from '@/components/DashboardCardWithBadge';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaRentRevisionRepository } from '@/features/rent-revision/infrastructure/PrismaRentRevisionRepository';
import { GetRevisionStats } from '@/features/rent-revision/application/GetRevisionStats';
import { PrismaBoilerRepository } from '@/features/boiler/infrastructure/PrismaBoilerRepository';
import { PrismaBoilerMaintenanceRepository } from '@/features/boiler/infrastructure/PrismaBoilerMaintenanceRepository';
import { GetBoilerOverdueStats } from '@/features/boiler/application/GetBoilerOverdueStats';
import { PrismaInsuranceCertificateRepository } from '@/features/insurance/infrastructure/PrismaInsuranceCertificateRepository';
import { GetInsuranceStats } from '@/features/insurance/application/GetInsuranceStats';

async function getRevisionStats() {
  try {
    // Use repository directly instead of HTTP fetch (better for SSR)
    const repository = new PrismaRentRevisionRepository(prisma);
    const useCase = new GetRevisionStats(repository);
    return await useCase.execute();
  } catch (error) {
    console.error('Error fetching revision stats:', error);
    return { urgentCount: 0, enPreparationCount: 0, courrierEnvoyeCount: 0, upcomingCount: 0 };
  }
}

async function getBoilerOverdueStats() {
  try {
    const boilerRepository = new PrismaBoilerRepository(prisma);
    const maintenanceRepository = new PrismaBoilerMaintenanceRepository(prisma);
    const useCase = new GetBoilerOverdueStats(boilerRepository, maintenanceRepository);
    return await useCase.execute();
  } catch (error) {
    console.error('Error fetching boiler overdue stats:', error);
    return { overdueCount: 0, noMaintenanceCount: 0, totalAttentionNeeded: 0 };
  }
}

async function getInsuranceStats() {
  try {
    // Fetch active lease IDs to check insurance status
    const now = new Date();
    const activeLeases = await prisma.lease.findMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: { id: true },
    });
    const activeLeaseIds = activeLeases.map((l) => l.id);

    const repository = new PrismaInsuranceCertificateRepository(prisma);
    const useCase = new GetInsuranceStats(repository);
    return await useCase.execute(activeLeaseIds);
  } catch (error) {
    console.error('Error fetching insurance stats:', error);
    return { expiredCount: 0, noInsuranceCount: 0, totalAttentionNeeded: 0 };
  }
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const t = await getTranslations('dashboard');
  const [revisionStats, boilerStats, insuranceStats] = await Promise.all([
    getRevisionStats(),
    getBoilerOverdueStats(),
    getInsuranceStats(),
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.email}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  {(await getTranslations('navigation'))('logout')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title={t('cards.landlords.title')} description={t('cards.landlords.description')} href="/dashboard/landlords" />
          <DashboardCard title={t('cards.properties.title')} description={t('cards.properties.description')} href="/dashboard/properties" />
          <DashboardCard title={t('cards.tenants.title')} description={t('cards.tenants.description')} href="/dashboard/tenants" />
          <DashboardCard title={t('cards.leases.title')} description={t('cards.leases.description')} href="/dashboard/leases" />
          <DashboardCardWithBadge
            title={(await getTranslations('rentRevisions.dashboard'))('title')}
            description={(await getTranslations('rentRevisions.dashboard'))('description')}
            href="/dashboard/rent-revisions"
            badge={
              revisionStats.urgentCount > 0
                ? {
                    count: revisionStats.urgentCount,
                    variant: 'red',
                    label: (await getTranslations('rentRevisions.dashboard'))('badgeUrgent'),
                  }
                : revisionStats.enPreparationCount > 0
                ? {
                    count: revisionStats.enPreparationCount,
                    variant: 'orange',
                    label: (await getTranslations('rentRevisions.dashboard'))('badgePreparation'),
                  }
                : revisionStats.courrierEnvoyeCount > 0
                ? {
                    count: revisionStats.courrierEnvoyeCount,
                    variant: 'green',
                    label: (await getTranslations('rentRevisions.dashboard'))('badgeSent'),
                  }
                : undefined
            }
          />
          <DashboardCardWithBadge
            title={t('cards.boilers.title')}
            description={t('cards.boilers.description')}
            href="/dashboard/boilers"
            badge={
              boilerStats.totalAttentionNeeded > 0
                ? {
                    count: boilerStats.totalAttentionNeeded,
                    variant: 'red',
                    label: t('cards.boilers.badgeOverdue'),
                  }
                : undefined
            }
          />
          <DashboardCard title={t('cards.prorata.title')} description={t('cards.prorata.description')} href="/fr/prorata" />
          <DashboardCardWithBadge
            title="Assurances"
            description="Gérer les attestations d'assurance"
            href="/dashboard/insurance"
            badge={
              insuranceStats.totalAttentionNeeded > 0
                ? {
                    count: insuranceStats.totalAttentionNeeded,
                    variant: 'red',
                    label: t('cards.insurance.badgeAttention'),
                  }
                : undefined
            }
          />
          <DashboardCard title="Compteurs d'eau" description="Suivre les relevés de compteurs" href="/dashboard/water-meters" />
          <DashboardCard title="Diagnostics" description="Gérer les diagnostics immobiliers" href="/dashboard/diagnostics" />
          <DashboardCard title="États des lieux" description="Tous les états des lieux" href="/dashboard/inventories" />
          <DashboardCard title="Publications" description="Annonces de mise en location" href="/dashboard/listings" />
          <DashboardCard title="Immeubles" description="Gérer les immeubles et les charges" href="/dashboard/buildings" />
          <DashboardCard title="Templates" description="Templates d'états des lieux" href="/dashboard/inventory-templates" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <a
            href="/dashboard/quick-rent-overview"
            className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{t('cards.quickRent.title')}</h3>
            <p className="text-blue-100">{t('cards.quickRent.description')}</p>
          </a>

          <a
            href="https://www.123bail.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">📄 Créer un bail</h3>
            <p className="text-green-100">
              Générer un contrat de bail conforme via 123bail.fr
            </p>
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('welcome')}</h2>
          <p className="text-gray-600">
            {t('instruction')}
          </p>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </a>
  );
}
