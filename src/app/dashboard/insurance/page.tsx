'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Property {
  id: string;
  name: string;
}

interface InsuranceCertificate {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
  issueDate: string;
  expiryDate: string;
  pdfPath: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export default function InsurancePage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<InsuranceCertificate[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<InsuranceCertificate | null>(null);

  const [addForm, setAddForm] = useState({
    propertyId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    pdf: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    issueDate: '',
    expiryDate: '',
    pdf: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, propsRes] = await Promise.all([
        fetch('/api/insurance/overview'),
        fetch('/api/properties'),
      ]);

      if (certsRes.ok) {
        const data = await certsRes.json();
        setCertificates(data);
      }
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.pdf) {
      alert('Veuillez sélectionner un fichier PDF');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('issueDate', addForm.issueDate);
      formData.append('expiryDate', addForm.expiryDate);
      formData.append('pdf', addForm.pdf);

      const response = await fetch(`/api/properties/${addForm.propertyId}/insurance`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowAddModal(false);
        setAddForm({
          propertyId: '',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          pdf: null,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout de l\'attestation');
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      alert('Erreur lors de l\'ajout de l\'attestation');
    }
  };

  const handleEditCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertificate) return;

    try {
      const formData = new FormData();
      if (editForm.issueDate) formData.append('issueDate', editForm.issueDate);
      if (editForm.expiryDate) formData.append('expiryDate', editForm.expiryDate);
      if (editForm.pdf) formData.append('pdf', editForm.pdf);

      const response = await fetch(`/api/insurance/${selectedCertificate.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowEditModal(false);
        setSelectedCertificate(null);
        setEditForm({ issueDate: '', expiryDate: '', pdf: null });
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette attestation ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/insurance/${certId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openEditModal = (cert: InsuranceCertificate) => {
    setSelectedCertificate(cert);
    setEditForm({
      issueDate: cert.issueDate.split('T')[0],
      expiryDate: cert.expiryDate.split('T')[0],
      pdf: null,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (cert: InsuranceCertificate) => {
    if (cert.isExpired) {
      return {
        className: 'bg-red-100 text-red-800 font-semibold',
        text: `⚠️ Expirée depuis ${Math.abs(cert.daysUntilExpiry)} jours`,
      };
    }
    if (cert.isExpiringSoon) {
      return {
        className: 'bg-orange-100 text-orange-800 font-semibold',
        text: `⚠️ Expire dans ${cert.daysUntilExpiry} jours`,
      };
    }
    return {
      className: 'bg-green-100 text-green-800',
      text: `✓ Valide (${cert.daysUntilExpiry} jours)`,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const expiredCount = certificates.filter((c) => c.isExpired).length;
  const expiringSoonCount = certificates.filter((c) => c.isExpiringSoon).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Retour au Dashboard
              </button>
              <h1 className="text-xl font-bold">Attestations d'assurance</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Ajouter une attestation
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
            <div className="text-sm text-gray-600">Attestations totales</div>
          </div>
          {expiredCount > 0 && (
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-800">{expiredCount}</div>
              <div className="text-sm text-red-600">Attestations expirées</div>
            </div>
          )}
          {expiringSoonCount > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-800">{expiringSoonCount}</div>
              <div className="text-sm text-orange-600">Expirent bientôt</div>
            </div>
          )}
        </div>

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucune attestation d'assurance.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Ajouter la première attestation
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date d'émission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date d'expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => {
                  const badge = getStatusBadge(cert);
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{cert.propertyName}</div>
                        <div className="text-xs text-gray-500">{cert.propertyAddress}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{cert.landlordName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(cert.issueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(cert.expiryDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <a
                          href={cert.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          📄 PDF
                        </a>
                        <button
                          onClick={() => openEditModal(cert)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Ajouter une attestation d'assurance</h3>
              <form onSubmit={handleAddCertificate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bien *
                  </label>
                  <select
                    required
                    value={addForm.propertyId}
                    onChange={(e) => setAddForm({ ...addForm, propertyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sélectionner un bien</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'émission *
                    </label>
                    <input
                      type="date"
                      required
                      value={addForm.issueDate}
                      onChange={(e) => setAddForm({ ...addForm, issueDate: e.target.value })}
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
                      value={addForm.expiryDate}
                      onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
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
                    onChange={(e) => setAddForm({ ...addForm, pdf: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddForm({
                        propertyId: '',
                        issueDate: new Date().toISOString().split('T')[0],
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
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Modifier l'attestation</h3>
              <form onSubmit={handleEditCertificate}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'émission
                    </label>
                    <input
                      type="date"
                      value={editForm.issueDate}
                      onChange={(e) => setEditForm({ ...editForm, issueDate: e.target.value })}
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
                      onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remplacer le PDF (optionnel)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEditForm({ ...editForm, pdf: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCertificate(null);
                      setEditForm({ issueDate: '', expiryDate: '', pdf: null });
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
    </div>
  );
}
