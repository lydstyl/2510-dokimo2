import { redirect } from 'next/navigation';
import { getSession } from '@/infrastructure/auth/session';
import { PrismaClient } from '@prisma/client';
import { getTranslations } from 'next-intl/server';

const prisma = new PrismaClient();

export default async function PropertiesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const t = await getTranslations('properties');
  const tNav = await getTranslations('navigation');

  const properties = await prisma.property.findMany({
    include: {
      landlord: true,
      leases: {
        include: {
          tenant: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                {tNav('backToDashboard')}
              </a>
              <h1 className="text-xl font-bold">{t('title')}</h1>
            </div>
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('heading')}</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              {t('addButton')}
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.address')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.landlord')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => {
                    const activeLeases = property.leases.filter(lease => !lease.endDate);
                    const isRented = activeLeases.length > 0;

                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {property.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{property.address}</div>
                          <div className="text-xs text-gray-500">{property.postalCode} {property.city}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{property.landlord.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isRented ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('status.rented')}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {t('rentedTo')} {activeLeases[0].tenant.firstName} {activeLeases[0].tenant.lastName}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {t('status.vacant')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">{t('actions.edit')}</button>
                          <button className="text-red-600 hover:text-red-900">{t('actions.delete')}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
