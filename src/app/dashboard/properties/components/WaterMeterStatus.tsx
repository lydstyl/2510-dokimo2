'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface WaterMeterReading {
  id: string;
  propertyId: string;
  readingDate: string;
  meterReading: number;
  documentPath: string | null;
  isOlderThanOneYear: boolean;
  monthsSinceReading: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  propertyId: string;
}

export function WaterMeterStatus({ propertyId }: Props) {
  const t = useTranslations('waterMeter');
  const [readings, setReadings] = useState<WaterMeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState<WaterMeterReading | null>(null);
  const [formData, setFormData] = useState({
    readingDate: new Date().toISOString().split('T')[0],
    meterReading: '',
    document: null as File | null,
  });

  useEffect(() => {
    fetchReadings();
  }, [propertyId]);

  const fetchReadings = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/water-meter`);
      if (response.ok) {
        const data = await response.json();
        setReadings(data);
      }
    } catch (error) {
      console.error('Error fetching water meter readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('propertyId', propertyId);
      formDataToSend.append('readingDate', formData.readingDate);
      formDataToSend.append('meterReading', formData.meterReading);
      if (formData.document) formDataToSend.append('document', formData.document);

      const response = await fetch('/api/water-meter', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchReadings();
        setShowAddModal(false);
        setFormData({ readingDate: new Date().toISOString().split('T')[0], meterReading: '', document: null });
      }
    } catch (error) {
      console.error('Error adding reading:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReading) return;

    try {
      const formDataToSend = new FormData();
      if (formData.readingDate) formDataToSend.append('readingDate', formData.readingDate);
      if (formData.meterReading) formDataToSend.append('meterReading', formData.meterReading);
      if (formData.document) formDataToSend.append('document', formData.document);

      const response = await fetch(`/api/water-meter/${selectedReading.id}`, {
        method: 'PATCH',
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchReadings();
        setShowEditModal(false);
        setSelectedReading(null);
        setFormData({ readingDate: new Date().toISOString().split('T')[0], meterReading: '', document: null });
      }
    } catch (error) {
      console.error('Error updating reading:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedReading) return;

    try {
      const response = await fetch(`/api/water-meter/${selectedReading.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReadings();
        setShowDeleteModal(false);
        setSelectedReading(null);
      }
    } catch (error) {
      console.error('Error deleting reading:', error);
    }
  };

  const openEditModal = (reading: WaterMeterReading) => {
    setSelectedReading(reading);
    setFormData({
      readingDate: new Date(reading.readingDate).toISOString().split('T')[0],
      meterReading: reading.meterReading.toString(),
      document: null,
    });
    setShowEditModal(true);
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement...</div>;

  const latestReading = readings[0];

  if (!latestReading) {
    return (
      <div className="text-sm">
        <span className="text-gray-500">Aucun relevé</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          + Ajouter
        </button>
        {showAddModal && (
          <ReadingFormModal
            title={t('modal.addTitle')}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAdd}
            formData={formData}
            setFormData={setFormData}
          />
        )}
      </div>
    );
  }

  const isOld = latestReading.isOlderThanOneYear;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Eau</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isOld
                ? 'bg-red-100 text-red-800 font-semibold'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {isOld ? `⚠️ ${latestReading.monthsSinceReading} mois` : `✓ ${latestReading.monthsSinceReading} mois`}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => openEditModal(latestReading)}
            className="text-xs text-blue-600 hover:text-blue-800"
            title={t('modal.edit')}
          >
            ✏️
          </button>
          <button
            onClick={() => { setSelectedReading(latestReading); setShowDeleteModal(true); }}
            className="text-xs text-red-600 hover:text-red-800"
            title={t('modal.delete')}
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-1">
        {latestReading.meterReading} m³
      </div>
      <div className="flex gap-2 text-xs">
        {latestReading.documentPath && (
          <a
            href={latestReading.documentPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800"
            title={t('modal.downloadDocument')}
          >
            📎 Télécharger
          </a>
        )}
        <button
          onClick={() => setShowAddModal(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          + Nouveau relevé
        </button>
        {readings.length > 1 && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            📋 Historique ({readings.length})
          </button>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <ReadingFormModal
          title={t('modal.addTitle')}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {showEditModal && (
        <ReadingFormModal
          title={t('modal.editTitle')}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReading(null);
            setFormData({ readingDate: new Date().toISOString().split('T')[0], meterReading: '', document: null });
          }}
          onSubmit={handleEdit}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {showDeleteModal && selectedReading && (
        <ConfirmDeleteModal
          title={t('modal.deleteTitle')}
          message={t('modal.deleteMessage')}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReading(null);
          }}
          onConfirm={handleDelete}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          readings={readings}
          onClose={() => setShowHistoryModal(false)}
          onDelete={(reading) => {
            setSelectedReading(reading);
            setShowHistoryModal(false);
            setShowDeleteModal(true);
          }}
        />
      )}
    </div>
  );
}

function ReadingFormModal({
  title,
  onClose,
  onSubmit,
  formData,
  setFormData,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { readingDate: string; meterReading: string; document: File | null };
  setFormData: (data: { readingDate: string; meterReading: string; document: File | null }) => void;
}) {
  const t = useTranslations('waterMeter.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('readingDate')}
              </label>
              <input
                type="date"
                required
                value={formData.readingDate}
                onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('meterReading')}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.meterReading}
                onChange={(e) => setFormData({ ...formData, meterReading: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 123.45"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('document')}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFormData({ ...formData, document: e.target.files?.[0] || null })}
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

function ConfirmDeleteModal({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('waterMeter.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-600">{title}</h3>
          <p className="text-gray-700 mb-6">{message}</p>
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

function HistoryModal({
  readings,
  onClose,
  onDelete,
}: {
  readings: WaterMeterReading[];
  onClose: () => void;
  onDelete: (reading: WaterMeterReading) => void;
}) {
  const t = useTranslations('waterMeter.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{t('viewHistoryTitle')}</h3>
          {readings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noHistory')}</p>
          ) : (
            <div className="space-y-3">
              {readings.map((reading) => (
                <div key={reading.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {new Date(reading.readingDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Index: {reading.meterReading} m³
                    </div>
                    <div className="text-sm text-gray-600">
                      {reading.isOlderThanOneYear
                        ? <span className="text-red-600">Plus d'un an ({reading.monthsSinceReading} mois)</span>
                        : <span className="text-green-600">{reading.monthsSinceReading} mois</span>
                      }
                    </div>
                    {reading.documentPath && (
                      <a
                        href={reading.documentPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        📎 {t('downloadDocument')}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(reading)}
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
