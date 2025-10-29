'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface BoilerWithMaintenance {
  boiler: {
    id: string;
    name: string | null;
    notes: string | null;
  };
  latestMaintenance: {
    id: string;
    maintenanceDate: string;
    documentPath: string | null;
    isOverdue: boolean;
    monthsSinceLastMaintenance: number;
  } | null;
}

interface Props {
  propertyId: string;
}

export function BoilerStatus({ propertyId }: Props) {
  const t = useTranslations('boilers');
  const [boilers, setBoilers] = useState<BoilerWithMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBoilerModal, setShowAddBoilerModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedBoilerId, setSelectedBoilerId] = useState<string | null>(null);
  const [boilerFormData, setBoilerFormData] = useState({ name: '', notes: '' });
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    document: null as File | null,
  });

  useEffect(() => {
    fetchBoilers();
  }, [propertyId]);

  const fetchBoilers = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/boilers`);
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

  const handleAddBoiler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/boilers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          name: boilerFormData.name || undefined,
          notes: boilerFormData.notes || undefined,
        }),
      });
      if (response.ok) {
        await fetchBoilers();
        setShowAddBoilerModal(false);
        setBoilerFormData({ name: '', notes: '' });
      }
    } catch (error) {
      console.error('Error adding boiler:', error);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoilerId) return;

    try {
      const formData = new FormData();
      formData.append('boilerId', selectedBoilerId);
      formData.append('maintenanceDate', maintenanceFormData.maintenanceDate);
      if (maintenanceFormData.document) {
        formData.append('document', maintenanceFormData.document);
      }

      const response = await fetch('/api/boilers/maintenance', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchBoilers();
        setShowMaintenanceModal(false);
        setSelectedBoilerId(null);
        setMaintenanceFormData({
          maintenanceDate: new Date().toISOString().split('T')[0],
          document: null,
        });
      }
    } catch (error) {
      console.error('Error adding maintenance:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (boilers.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <span>Aucune chaudière</span>
        <button
          onClick={() => setShowAddBoilerModal(true)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          + Ajouter
        </button>
        {showAddBoilerModal && (
          <AddBoilerModal
            onClose={() => setShowAddBoilerModal(false)}
            onSubmit={handleAddBoiler}
            formData={boilerFormData}
            setFormData={setBoilerFormData}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {boilers.map((item) => {
        const isOverdue = item.latestMaintenance?.isOverdue;
        const months = item.latestMaintenance?.monthsSinceLastMaintenance;

        return (
          <div key={item.boiler.id} className="mb-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.boiler.name || 'Chaudière'}</span>
              {item.latestMaintenance ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isOverdue
                      ? 'bg-red-100 text-red-800 font-semibold'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isOverdue ? `⚠️ ${months} mois` : `✓ ${months} mois`}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                  Jamais entretenu
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedBoilerId(item.boiler.id);
                  setShowMaintenanceModal(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('addMaintenance')}
              </button>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => setShowAddBoilerModal(true)}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
      >
        + Ajouter une chaudière
      </button>

      {showAddBoilerModal && (
        <AddBoilerModal
          onClose={() => setShowAddBoilerModal(false)}
          onSubmit={handleAddBoiler}
          formData={boilerFormData}
          setFormData={setBoilerFormData}
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceModal
          onClose={() => {
            setShowMaintenanceModal(false);
            setSelectedBoilerId(null);
          }}
          onSubmit={handleAddMaintenance}
          formData={maintenanceFormData}
          setFormData={setMaintenanceFormData}
        />
      )}
    </div>
  );
}

function AddBoilerModal({
  onClose,
  onSubmit,
  formData,
  setFormData,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { name: string; notes: string };
  setFormData: (data: { name: string; notes: string }) => void;
}) {
  const t = useTranslations('boilers.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{t('addBoilerTitle')}</h3>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MaintenanceModal({
  onClose,
  onSubmit,
  formData,
  setFormData,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { maintenanceDate: string; document: File | null };
  setFormData: (data: { maintenanceDate: string; document: File | null }) => void;
}) {
  const t = useTranslations('boilers.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{t('addMaintenanceTitle')}</h3>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('maintenanceDate')}
              </label>
              <input
                type="date"
                required
                value={formData.maintenanceDate}
                onChange={(e) =>
                  setFormData({ ...formData, maintenanceDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('document')}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setFormData({ ...formData, document: e.target.files?.[0] || null })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">PDF ou image (optionnel)</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
