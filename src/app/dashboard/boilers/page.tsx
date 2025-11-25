'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface BoilerOverview {
  boiler: {
    id: string;
    name: string | null;
    notes: string | null;
  };
  property: {
    id: string;
    name: string;
    address: string;
    postalCode: string;
    city: string;
  };
  tenant: {
    id: string;
    civility: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  latestMaintenance: {
    id: string;
    maintenanceDate: string;
    documentPath: string | null;
  } | null;
  maintenanceStatus: {
    monthsSinceMaintenance: number | null;
    nextMaintenanceDate: string | null;
    isOverdue: boolean;
  };
}

export default function BoilersPage() {
  const t = useTranslations('boilers');
  const tNav = useTranslations('navigation');

  const [boilers, setBoilers] = useState<BoilerOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoilers, setSelectedBoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBoilers();
  }, []);

  const fetchBoilers = async () => {
    try {
      const response = await fetch('/api/boilers/overview');
      if (response.ok) {
        const data = await response.json();
        setBoilers(data);
      }
    } catch (error) {
      console.error('Error fetching boilers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBoilerSelection = (boilerId: string) => {
    setSelectedBoilers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boilerId)) {
        newSet.delete(boilerId);
      } else {
        newSet.add(boilerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedBoilers(new Set(boilers.map((b) => b.boiler.id)));
  };

  const handleSelectNone = () => {
    setSelectedBoilers(new Set());
  };

  const handleExport = async () => {
    if (selectedBoilers.size === 0) {
      alert(t('overview.noSelection'));
      return;
    }

    try {
      const boilerIds = Array.from(selectedBoilers).join(',');
      const response = await fetch(`/api/boilers/export?ids=${boilerIds}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chaudieres-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting boilers:', error);
      alert('Erreur lors de l\'exportation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('overview.heading')}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {t('overview.selectAll')}
              </button>
              <button
                onClick={handleSelectNone}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                {t('overview.selectNone')}
              </button>
              <button
                onClick={handleExport}
                disabled={selectedBoilers.size === 0}
                className={`px-4 py-2 rounded-md ${
                  selectedBoilers.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {t('overview.exportSelected', { count: selectedBoilers.size })}
              </button>
            </div>
          </div>

          {boilers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('overview.emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={boilers.length > 0 && selectedBoilers.size === boilers.length}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleSelectNone()}
                        className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.property')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.boiler')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.tenant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.lastMaintenance')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.nextMaintenance')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boilers.map((item) => {
                    const isOverdue = item.maintenanceStatus.isOverdue;
                    const hasNoMaintenance = !item.latestMaintenance;

                    return (
                      <tr
                        key={item.boiler.id}
                        className={`hover:bg-gray-50 ${
                          isOverdue ? 'bg-red-50' : hasNoMaintenance ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBoilers.has(item.boiler.id)}
                            onChange={() => toggleBoilerSelection(item.boiler.id)}
                            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.property.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.property.address}, {item.property.postalCode} {item.property.city}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item.boiler.name || '-'}
                          </div>
                          {item.boiler.notes && (
                            <div className="text-xs text-gray-500">{item.boiler.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.tenant ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {item.tenant.civility} {item.tenant.firstName} {item.tenant.lastName}
                              </div>
                              {item.tenant.email && (
                                <div className="text-xs text-gray-500">{item.tenant.email}</div>
                              )}
                              {item.tenant.phone && (
                                <div className="text-xs text-gray-500">{item.tenant.phone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.latestMaintenance ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(item.latestMaintenance.maintenanceDate).toLocaleDateString(
                                  'fr-FR'
                                )}
                              </div>
                              {item.maintenanceStatus.monthsSinceMaintenance !== null && (
                                <div
                                  className={`text-xs ${
                                    isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                                  }`}
                                >
                                  {isOverdue
                                    ? t('maintenanceStatus.overdue')
                                    : t('maintenanceStatus.monthsSince', {
                                        months: item.maintenanceStatus.monthsSinceMaintenance,
                                      })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {t('maintenanceStatus.never')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.maintenanceStatus.nextMaintenanceDate ? (
                            <div className="text-sm text-gray-900">
                              {new Date(
                                item.maintenanceStatus.nextMaintenanceDate
                              ).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasNoMaintenance ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">
                              {t('status.noMaintenance')}
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">
                              {t('status.overdue')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
                              {t('status.ok')}
                            </span>
                          )}
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
