'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Maintenance {
  id: string;
  maintenanceDate: string;
  documentPath: string | null;
}

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
  const [showEditBoilerModal, setShowEditBoilerModal] = useState(false);
  const [showDeleteBoilerModal, setShowDeleteBoilerModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);
  const [selectedBoiler, setSelectedBoiler] = useState<BoilerWithMaintenance | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<Maintenance[]>([]);
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

  const fetchMaintenanceHistory = async (boilerId: string) => {
    try {
      const response = await fetch(`/api/boilers/maintenance?boilerId=${boilerId}`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceHistory(data);
      }
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
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

  const handleEditBoiler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoiler) return;

    try {
      const response = await fetch(`/api/boilers/${selectedBoiler.boiler.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: boilerFormData.name || undefined,
          notes: boilerFormData.notes || undefined,
        }),
      });
      if (response.ok) {
        await fetchBoilers();
        setShowEditBoilerModal(false);
        setSelectedBoiler(null);
        setBoilerFormData({ name: '', notes: '' });
      }
    } catch (error) {
      console.error('Error updating boiler:', error);
    }
  };

  const handleDeleteBoiler = async () => {
    if (!selectedBoiler) return;

    try {
      const response = await fetch(`/api/boilers/${selectedBoiler.boiler.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBoilers();
        setShowDeleteBoilerModal(false);
        setSelectedBoiler(null);
      }
    } catch (error) {
      console.error('Error deleting boiler:', error);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoiler) return;

    try {
      const formData = new FormData();
      formData.append('boilerId', selectedBoiler.boiler.id);
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
        setSelectedBoiler(null);
        setMaintenanceFormData({
          maintenanceDate: new Date().toISOString().split('T')[0],
          document: null,
        });
      }
    } catch (error) {
      console.error('Error adding maintenance:', error);
    }
  };

  const handleDeleteMaintenance = async (maintenanceId: string) => {
    if (!confirm(t('modal.deleteMaintenanceMessage'))) return;

    try {
      const response = await fetch(`/api/boilers/maintenance/${maintenanceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBoilers();
        if (selectedBoiler) {
          await fetchMaintenanceHistory(selectedBoiler.boiler.id);
        }
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  const openEditBoilerModal = (boiler: BoilerWithMaintenance) => {
    setSelectedBoiler(boiler);
    setBoilerFormData({
      name: boiler.boiler.name || '',
      notes: boiler.boiler.notes || '',
    });
    setShowEditBoilerModal(true);
  };

  const openDeleteBoilerModal = (boiler: BoilerWithMaintenance) => {
    setSelectedBoiler(boiler);
    setShowDeleteBoilerModal(true);
  };

  const openMaintenanceModal = (boiler: BoilerWithMaintenance) => {
    setSelectedBoiler(boiler);
    setShowMaintenanceModal(true);
  };

  const openMaintenanceHistory = async (boiler: BoilerWithMaintenance) => {
    setSelectedBoiler(boiler);
    await fetchMaintenanceHistory(boiler.boiler.id);
    setShowMaintenanceHistory(true);
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
          <BoilerFormModal
            title={t('modal.addBoilerTitle')}
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
          <div key={item.boiler.id} className="mb-3 text-sm border-b pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <span className="font-medium">{item.boiler.name || 'Chaudière'}</span>
                {item.latestMaintenance ? (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      isOverdue
                        ? 'bg-red-100 text-red-800 font-semibold'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {isOverdue ? `⚠️ ${months} mois` : `✓ ${months} mois`}
                  </span>
                ) : (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    Jamais entretenu
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditBoilerModal(item)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  title={t('modal.edit')}
                >
                  ✏️
                </button>
                <button
                  onClick={() => openDeleteBoilerModal(item)}
                  className="text-xs text-red-600 hover:text-red-800"
                  title={t('modal.delete')}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => openMaintenanceModal(item)}
                className="text-blue-600 hover:text-blue-800"
              >
                + {t('addMaintenance')}
              </button>
              <button
                onClick={() => openMaintenanceHistory(item)}
                className="text-gray-600 hover:text-gray-800"
              >
                📋 {t('modal.viewHistory')}
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

      {/* Modals */}
      {showAddBoilerModal && (
        <BoilerFormModal
          title={t('modal.addBoilerTitle')}
          onClose={() => setShowAddBoilerModal(false)}
          onSubmit={handleAddBoiler}
          formData={boilerFormData}
          setFormData={setBoilerFormData}
        />
      )}

      {showEditBoilerModal && (
        <BoilerFormModal
          title={t('modal.editBoilerTitle')}
          onClose={() => {
            setShowEditBoilerModal(false);
            setSelectedBoiler(null);
            setBoilerFormData({ name: '', notes: '' });
          }}
          onSubmit={handleEditBoiler}
          formData={boilerFormData}
          setFormData={setBoilerFormData}
        />
      )}

      {showDeleteBoilerModal && selectedBoiler && (
        <ConfirmDeleteModal
          title={t('modal.deleteBoilerTitle')}
          message={t('modal.deleteBoilerMessage')}
          itemName={selectedBoiler.boiler.name || 'cette chaudière'}
          onClose={() => {
            setShowDeleteBoilerModal(false);
            setSelectedBoiler(null);
          }}
          onConfirm={handleDeleteBoiler}
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceFormModal
          onClose={() => {
            setShowMaintenanceModal(false);
            setSelectedBoiler(null);
          }}
          onSubmit={handleAddMaintenance}
          formData={maintenanceFormData}
          setFormData={setMaintenanceFormData}
        />
      )}

      {showMaintenanceHistory && selectedBoiler && (
        <MaintenanceHistoryModal
          boilerName={selectedBoiler.boiler.name || 'Chaudière'}
          maintenances={maintenanceHistory}
          onClose={() => {
            setShowMaintenanceHistory(false);
            setSelectedBoiler(null);
            setMaintenanceHistory([]);
          }}
          onDelete={handleDeleteMaintenance}
        />
      )}
    </div>
  );
}

// Boiler Form Modal (Add/Edit)
function BoilerFormModal({
  title,
  onClose,
  onSubmit,
  formData,
  setFormData,
}: {
  title: string;
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
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
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

// Confirm Delete Modal
function ConfirmDeleteModal({
  title,
  message,
  itemName,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('boilers.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-600">{title}</h3>
          <p className="text-gray-700 mb-2">
            {message}
          </p>
          <p className="text-sm text-gray-600 mb-6">
            <strong>{itemName}</strong>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Maintenance Form Modal
function MaintenanceFormModal({
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

// Maintenance History Modal
function MaintenanceHistoryModal({
  boilerName,
  maintenances,
  onClose,
  onDelete,
}: {
  boilerName: string;
  maintenances: Maintenance[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('boilers.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {t('viewMaintenanceTitle')} - {boilerName}
          </h3>
          {maintenances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noMaintenanceHistory')}</p>
          ) : (
            <div className="space-y-3">
              {maintenances.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(maintenance.maintenanceDate).toLocaleDateString('fr-FR')}
                    </div>
                    {maintenance.documentPath && (
                      <a
                        href={maintenance.documentPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        📎 {t('downloadDocument')}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(maintenance.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️ {t('delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
