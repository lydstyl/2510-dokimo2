'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Revision {
  id: string;
  leaseId: string;
  effectiveDate: string;
  rentAmount: number;
  chargesAmount: number;
  totalAmount: number;
  reason?: string;
  status: string;
  isUrgent: boolean;
  lease?: {
    id: string;
    property: {
      name: string;
      address: string;
    };
    tenant: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

interface RevisionsData {
  urgent: Revision[];
  enPreparation: Revision[];
  courrierEnvoye: Revision[];
}

export function RentRevisionsClient() {
  const t = useTranslations('rentRevisions');
  const [revisions, setRevisions] = useState<RevisionsData>({ urgent: [], enPreparation: [], courrierEnvoye: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      const response = await fetch('/api/rent-revisions');
      if (response.ok) {
        const data = await response.json();
        setRevisions(data);
      }
    } catch (error) {
      console.error('Error fetching revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async (id: string) => {
    if (!confirm(t('confirmMarkSent'))) return;

    try {
      const response = await fetch(`/api/rent-revisions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsLetterSent: true }),
      });

      if (response.ok) {
        await fetchRevisions();
      }
    } catch (error) {
      console.error('Error marking revision as sent:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`/api/rent-revisions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRevisions();
      }
    } catch (error) {
      console.error('Error deleting revision:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  const totalRevisions = revisions.urgent.length + revisions.enPreparation.length + revisions.courrierEnvoye.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('pageTitle')}</h2>
            <p className="text-gray-600">{t('pageDescription')}</p>
          </div>
          <a
            href="/dashboard/rent-revisions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t('createButton')}
          </a>
        </div>
      </div>

      {/* Urgent Revisions */}
      {revisions.urgent.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-red-600 mb-4">
            ⚠️ {t('urgentTitle')} ({revisions.urgent.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <RevisionTable
              revisions={revisions.urgent}
              variant="urgent"
              onMarkAsSent={handleMarkAsSent}
              onDelete={handleDelete}
            />
          </div>
        </section>
      )}

      {/* En Préparation Revisions */}
      {revisions.enPreparation.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-orange-600 mb-4">
            📋 {t('preparationTitle')} ({revisions.enPreparation.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <RevisionTable
              revisions={revisions.enPreparation}
              variant="preparation"
              onMarkAsSent={handleMarkAsSent}
              onDelete={handleDelete}
            />
          </div>
        </section>
      )}

      {/* Courrier Envoyé Revisions */}
      {revisions.courrierEnvoye.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-green-600 mb-4">
            ✅ {t('sentTitle')} ({revisions.courrierEnvoye.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <RevisionTable
              revisions={revisions.courrierEnvoye}
              variant="sent"
              onMarkAsSent={handleMarkAsSent}
              onDelete={handleDelete}
            />
          </div>
        </section>
      )}

      {/* Empty State */}
      {totalRevisions === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">{t('noRevisions')}</p>
          <p className="text-sm text-gray-400">{t('noRevisionsHint')}</p>
        </div>
      )}
    </div>
  );
}

interface RevisionTableProps {
  revisions: Revision[];
  variant: 'urgent' | 'preparation' | 'sent';
  onMarkAsSent: (id: string) => void;
  onDelete: (id: string) => void;
}

function RevisionTable({ revisions, variant, onMarkAsSent, onDelete }: RevisionTableProps) {
  const t = useTranslations('rentRevisions');

  const bgClass = variant === 'urgent' ? 'bg-red-50' : variant === 'preparation' ? 'bg-orange-50' : '';

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('property')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('tenant')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('effectiveDate')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('newRent')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reason')}</th>
          {variant !== 'sent' && (
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {revisions.map((revision) => (
          <tr key={revision.id} className={bgClass}>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900">
                {revision.lease?.property.name || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                {revision.lease?.property.address || ''}
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {revision.lease?.tenant
                ? `${revision.lease.tenant.firstName} ${revision.lease.tenant.lastName}`
                : 'N/A'}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {new Date(revision.effectiveDate).toLocaleDateString('fr-FR')}
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-semibold text-gray-900">
                {revision.totalAmount.toFixed(2)} €
              </div>
              <div className="text-xs text-gray-500">
                {revision.rentAmount.toFixed(2)} € + {revision.chargesAmount.toFixed(2)} €
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {revision.reason || '-'}
            </td>
            {variant !== 'sent' && (
              <td className="px-6 py-4 text-right text-sm space-x-2">
                <button
                  onClick={() => onMarkAsSent(revision.id)}
                  className="text-green-600 hover:text-green-800 font-medium"
                  title={t('markSent')}
                >
                  ✉️
                </button>
                <button
                  onClick={() => onDelete(revision.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                  title={t('delete')}
                >
                  🗑️
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
