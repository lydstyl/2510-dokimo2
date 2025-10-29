'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Property {
  id: string;
  name: string;
}

interface Diagnostic {
  id: string;
  name: string;
  diagnosticDate: string;
  expiryDate: string;
  pdfPath: string;
  isValid: boolean;
  daysUntilExpiry: number;
  createdAt: string;
  updatedAt: string;
}

export default function PropertyDiagnosticsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    diagnosticDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    pdf: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    diagnosticDate: '',
    expiryDate: '',
    pdf: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      const [propRes, diagnosticsRes] = await Promise.all([
        fetch(`/api/properties/${propertyId}`),
        fetch(`/api/properties/${propertyId}/diagnostics`),
      ]);

      if (propRes.ok) {
        const propData = await propRes.json();
        setProperty(propData);
      }
      if (diagnosticsRes.ok) {
        const diagnosticsData = await diagnosticsRes.json();
        setDiagnostics(diagnosticsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.pdf) {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', createForm.name);
      formData.append('diagnosticDate', createForm.diagnosticDate);
      formData.append('expiryDate', createForm.expiryDate);
      formData.append('pdf', createForm.pdf);

      const response = await fetch(`/api/properties/${propertyId}/diagnostics`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          diagnosticDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          pdf: null,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création du diagnostic');
      }
    } catch (error) {
      console.error('Error creating diagnostic:', error);
      alert('Erreur lors de la création du diagnostic');
    }
  };

  const handleEditDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiagnostic) return;

    try {
      const formData = new FormData();
      if (editForm.name) formData.append('name', editForm.name);
      if (editForm.diagnosticDate) formData.append('diagnosticDate', editForm.diagnosticDate);
      if (editForm.expiryDate) formData.append('expiryDate', editForm.expiryDate);
      if (editForm.pdf) formData.append('pdf', editForm.pdf);

      const response = await fetch(`/api/diagnostics/${selectedDiagnostic.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowEditModal(false);
        setSelectedDiagnostic(null);
        setEditForm({ name: '', diagnosticDate: '', expiryDate: '', pdf: null });
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la modification du diagnostic');
      }
    } catch (error) {
      console.error('Error updating diagnostic:', error);
      alert('Erreur lors de la modification du diagnostic');
    }
  };

  const handleDeleteDiagnostic = async (diagnosticId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce diagnostic ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/diagnostics/${diagnosticId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression du diagnostic');
      }
    } catch (error) {
      console.error('Error deleting diagnostic:', error);
      alert('Erreur lors de la suppression du diagnostic');
    }
  };

  const openEditModal = (diagnostic: Diagnostic) => {
    setSelectedDiagnostic(diagnostic);
    setEditForm({
      name: diagnostic.name,
      diagnosticDate: diagnostic.diagnosticDate.split('T')[0],
      expiryDate: diagnostic.expiryDate.split('T')[0],
      pdf: null,
    });
    setShowEditModal(true);
  };

  const getValidityBadge = (diagnostic: Diagnostic) => {
    if (!diagnostic.isValid) {
      return {
        className: 'bg-red-100 text-red-800 font-semibold',
        text: `⚠️ Expiré depuis ${Math.abs(diagnostic.daysUntilExpiry)} jours`,
      };
    }
    if (diagnostic.daysUntilExpiry <= 30) {
      return {
        className: 'bg-red-100 text-red-800 font-semibold',
        text: `⚠️ Expire dans ${diagnostic.daysUntilExpiry} jours`,
      };
    }
    if (diagnostic.daysUntilExpiry <= 90) {
      return {
        className: 'bg-orange-100 text-orange-800',
        text: `À renouveler (${diagnostic.daysUntilExpiry} jours)`,
      };
    }
    return {
      className: 'bg-green-100 text-green-800',
      text: `✓ Valide (${diagnostic.daysUntilExpiry} jours)`,
    };
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!property) return <div className="p-8">Bien introuvable</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/properties')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour aux biens
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Diagnostics - {property.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Gérer les diagnostics immobiliers (DPE, amiante, plomb, etc.)
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Nouveau diagnostic
            </button>
          </div>
        </div>

        {/* Diagnostics List */}
        {diagnostics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun diagnostic pour ce bien.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer le premier diagnostic
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnostics.map((diagnostic) => {
              const badge = getValidityBadge(diagnostic);
              return (
                <div
                  key={diagnostic.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {diagnostic.name}
                        </h3>
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-medium ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Date du diagnostic :</strong>{' '}
                          {new Date(diagnostic.diagnosticDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p>
                          <strong>Date d'expiration :</strong>{' '}
                          {new Date(diagnostic.expiryDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p>
                          <a
                            href={diagnostic.pdfPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            📄 Télécharger le PDF
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(diagnostic)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteDiagnostic(diagnostic.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Diagnostic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Nouveau diagnostic</h3>
              <form onSubmit={handleCreateDiagnostic}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du diagnostic *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: DPE, Diagnostic amiante, Diagnostic plomb"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date du diagnostic *
                    </label>
                    <input
                      type="date"
                      required
                      value={createForm.diagnosticDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, diagnosticDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'expiration *
                    </label>
                    <input
                      type="date"
                      required
                      value={createForm.expiryDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, expiryDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier PDF *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf"
                    onChange={(e) =>
                      setCreateForm({ ...createForm, pdf: e.target.files?.[0] || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Uniquement les fichiers PDF
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({
                        name: '',
                        diagnosticDate: new Date().toISOString().split('T')[0],
                        expiryDate: '',
                        pdf: null,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Créer le diagnostic
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Diagnostic Modal */}
      {showEditModal && selectedDiagnostic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Modifier le diagnostic</h3>
              <form onSubmit={handleEditDiagnostic}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du diagnostic
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date du diagnostic
                    </label>
                    <input
                      type="date"
                      value={editForm.diagnosticDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, diagnosticDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      value={editForm.expiryDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, expiryDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remplacer le fichier PDF (optionnel)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setEditForm({ ...editForm, pdf: e.target.files?.[0] || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laisser vide pour conserver le fichier actuel
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDiagnostic(null);
                      setEditForm({ name: '', diagnosticDate: '', expiryDate: '', pdf: null });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Enregistrer les modifications
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
