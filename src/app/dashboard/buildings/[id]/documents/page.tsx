'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface FinancialDocument {
  id: string;
  category: string;
  date: string;
  amount: number;
  description: string;
  documentPath: string | null;
  includedInCharges: boolean;
  waterConsumption: number | null;
  isWaterBill: boolean;
}

const CATEGORIES = {
  ELECTRICITY: 'Électricité',
  WATER: 'Eau',
  CLEANING: 'Ménage',
  GARBAGE_TAX: 'Taxe ordures ménagères',
  HEATING: 'Chauffage',
  ELEVATOR: 'Ascenseur',
  COMMON_AREA_MAINTENANCE: 'Entretien espaces communs',
  PROPERTY_TAX: 'Taxe foncière',
  RENOVATION_WORK: 'Travaux de rénovation',
  REPAIR_WORK: 'Travaux de réparation',
  INSURANCE: 'Assurance',
  OTHER: 'Autre',
};

export default function FinancialDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FinancialDocument | null>(null);
  const [formData, setFormData] = useState({
    category: 'ELECTRICITY',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    includedInCharges: true,
    waterConsumption: '',
    document: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
  }, [buildingId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('includedInCharges', formData.includedInCharges.toString());
      if (formData.waterConsumption) {
        formDataToSend.append('waterConsumption', formData.waterConsumption);
      }
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }

      const url = editingDoc
        ? `/api/financial-documents/${editingDoc.id}`
        : `/api/buildings/${buildingId}/documents`;
      const method = editingDoc ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchDocuments();
        setShowModal(false);
        setEditingDoc(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch(`/api/financial-documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openEditModal = (doc: FinancialDocument) => {
    setEditingDoc(doc);
    setFormData({
      category: doc.category,
      date: new Date(doc.date).toISOString().split('T')[0],
      amount: doc.amount.toString(),
      description: doc.description,
      includedInCharges: doc.includedInCharges,
      waterConsumption: doc.waterConsumption?.toString() || '',
      document: null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      category: 'ELECTRICITY',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      includedInCharges: true,
      waterConsumption: '',
      document: null,
    });
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  const includedDocs = documents.filter((d) => d.includedInCharges);
  const excludedDocs = documents.filter((d) => !d.includedInCharges);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/buildings/${buildingId}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour à l'immeuble
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Documents financiers</h1>
            <button
              onClick={() => {
                resetForm();
                setEditingDoc(null);
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Ajouter un document
            </button>
          </div>
        </div>

        {/* Included in charges */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              ✓ Inclus dans les charges ({includedDocs.length})
            </h2>
            <p className="text-sm text-gray-600">Ces documents sont utilisés pour le calcul de régularisation</p>
          </div>
          <div className="p-4">
            {includedDocs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun document inclus dans les charges</p>
            ) : (
              <DocumentList documents={includedDocs} onEdit={openEditModal} onDelete={handleDelete} />
            )}
          </div>
        </div>

        {/* Excluded from charges */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Archive - Non inclus dans les charges ({excludedDocs.length})
            </h2>
            <p className="text-sm text-gray-600">Documents archivés (travaux, etc.)</p>
          </div>
          <div className="p-4">
            {excludedDocs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun document archivé</p>
            ) : (
              <DocumentList documents={excludedDocs} onEdit={openEditModal} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingDoc ? 'Modifier le document' : 'Ajouter un document financier'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: Facture électricité janvier 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {formData.category === 'WATER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consommation (m³)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.waterConsumption}
                        onChange={(e) =>
                          setFormData({ ...formData, waterConsumption: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document (PDF ou image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setFormData({ ...formData, document: e.target.files?.[0] || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includedInCharges}
                      onChange={(e) =>
                        setFormData({ ...formData, includedInCharges: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ✓ Inclure dans le calcul des charges
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Décochez pour archiver (travaux, etc.)
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDoc(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DocumentList({
  documents,
  onEdit,
  onDelete,
}: {
  documents: FinancialDocument[];
  onEdit: (doc: FinancialDocument) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border rounded-lg p-4 flex justify-between items-start hover:bg-gray-50"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {CATEGORIES[doc.category as keyof typeof CATEGORIES]}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(doc.date).toLocaleDateString('fr-FR')}
              </span>
              {doc.isWaterBill && doc.waterConsumption && (
                <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                  {doc.waterConsumption} m³
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">{doc.description}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{doc.amount.toFixed(2)} €</p>
            {doc.documentPath && (
              <a
                href={doc.documentPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                📎 Télécharger le document
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(doc)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={() => onDelete(doc.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
