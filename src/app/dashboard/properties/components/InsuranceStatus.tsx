'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface InsuranceCertificate {
  id: string;
  startDate: string;
  endDate: string | null;
  documentPath: string | null;
  isExpired: boolean;
  isOlderThanOneYear: boolean;
  monthsSinceStart: number;
}

interface Props {
  propertyId: string;
}

export function InsuranceStatus({ propertyId }: Props) {
  const t = useTranslations('insurance');
  const [certificates, setCertificates] = useState<InsuranceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<InsuranceCertificate | null>(null);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    document: null as File | null,
  });

  useEffect(() => {
    fetchCertificates();
  }, [propertyId]);

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/insurance`);
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error('Error fetching insurance certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('propertyId', propertyId);
      formDataToSend.append('startDate', formData.startDate);
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate);
      if (formData.document) formDataToSend.append('document', formData.document);

      const response = await fetch('/api/insurance', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchCertificates();
        setShowAddModal(false);
        setFormData({ startDate: new Date().toISOString().split('T')[0], endDate: '', document: null });
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertificate) return;

    try {
      const formDataToSend = new FormData();
      if (formData.startDate) formDataToSend.append('startDate', formData.startDate);
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate);
      if (formData.document) formDataToSend.append('document', formData.document);

      const response = await fetch(`/api/insurance/${selectedCertificate.id}`, {
        method: 'PATCH',
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchCertificates();
        setShowEditModal(false);
        setSelectedCertificate(null);
        setFormData({ startDate: new Date().toISOString().split('T')[0], endDate: '', document: null });
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedCertificate) return;

    try {
      const response = await fetch(`/api/insurance/${selectedCertificate.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCertificates();
        setShowDeleteModal(false);
        setSelectedCertificate(null);
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
    }
  };

  const openEditModal = (cert: InsuranceCertificate) => {
    setSelectedCertificate(cert);
    setFormData({
      startDate: new Date(cert.startDate).toISOString().split('T')[0],
      endDate: cert.endDate ? new Date(cert.endDate).toISOString().split('T')[0] : '',
      document: null,
    });
    setShowEditModal(true);
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement...</div>;

  const latestCert = certificates[0];

  if (!latestCert) {
    return (
      <div className="text-sm">
        <span className="text-gray-500">Aucune assurance</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          + Ajouter
        </button>
        {showAddModal && (
          <CertificateFormModal
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

  const isExpired = latestCert.isExpired;
  const isOld = latestCert.isOlderThanOneYear;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Assurance</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isExpired
                ? 'bg-red-100 text-red-800 font-semibold'
                : isOld
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {isExpired ? '⚠️ Expirée' : isOld ? `⚠️ ${latestCert.monthsSinceStart} mois` : `✓ ${latestCert.monthsSinceStart} mois`}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => openEditModal(latestCert)}
            className="text-xs text-blue-600 hover:text-blue-800"
            title={t('modal.edit')}
          >
            ✏️
          </button>
          <button
            onClick={() => { setSelectedCertificate(latestCert); setShowDeleteModal(true); }}
            className="text-xs text-red-600 hover:text-red-800"
            title={t('modal.delete')}
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setShowAddModal(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          + Nouvelle attestation
        </button>
        {certificates.length > 1 && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            📋 Historique ({certificates.length})
          </button>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <CertificateFormModal
          title={t('modal.addTitle')}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {showEditModal && (
        <CertificateFormModal
          title={t('modal.editTitle')}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCertificate(null);
            setFormData({ startDate: new Date().toISOString().split('T')[0], endDate: '', document: null });
          }}
          onSubmit={handleEdit}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {showDeleteModal && selectedCertificate && (
        <ConfirmDeleteModal
          title={t('modal.deleteTitle')}
          message={t('modal.deleteMessage')}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCertificate(null);
          }}
          onConfirm={handleDelete}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          certificates={certificates}
          onClose={() => setShowHistoryModal(false)}
          onDelete={(cert) => {
            setSelectedCertificate(cert);
            setShowHistoryModal(false);
            setShowDeleteModal(true);
          }}
        />
      )}
    </div>
  );
}

function CertificateFormModal({
  title,
  onClose,
  onSubmit,
  formData,
  setFormData,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { startDate: string; endDate: string; document: File | null };
  setFormData: (data: { startDate: string; endDate: string; document: File | null }) => void;
}) {
  const t = useTranslations('insurance.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('startDate')}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('endDate')}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
  const t = useTranslations('insurance.modal');

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
  certificates,
  onClose,
  onDelete,
}: {
  certificates: InsuranceCertificate[];
  onClose: () => void;
  onDelete: (cert: InsuranceCertificate) => void;
}) {
  const t = useTranslations('insurance.modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">{t('viewHistoryTitle')}</h3>
          {certificates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noHistory')}</p>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      Du {new Date(cert.startDate).toLocaleDateString('fr-FR')}
                      {cert.endDate && ` au ${new Date(cert.endDate).toLocaleDateString('fr-FR')}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {cert.isExpired
                        ? <span className="text-red-600">Expirée</span>
                        : cert.isOlderThanOneYear
                        ? <span className="text-yellow-600">Plus d'un an</span>
                        : <span className="text-green-600">Valide</span>
                      }
                    </div>
                    {cert.documentPath && (
                      <a
                        href={cert.documentPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        📎 {t('downloadDocument')}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(cert)}
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
