'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaseInsuranceItem {
  lease: {
    id: string;
    startDate: string;
    endDate: string | null;
  };
  property: {
    id: string;
    name: string;
    address: string;
    postalCode: string;
    city: string;
  };
  landlord: {
    id: string;
    name: string;
    email: string | null;
  };
  tenant: {
    id: string;
    civility: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  latestCertificate: {
    id: string;
    startDate: string;
    endDate: string | null;
    documentPath: string | null;
  } | null;
  insuranceStatus: 'valid' | 'expired' | 'none';
  daysUntilExpiry: number | null;
}

export default function InsurancePage() {
  const router = useRouter();
  const [items, setItems] = useState<LeaseInsuranceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeaseInsuranceItem | null>(null);

  const [addForm, setAddForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    document: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    startDate: '',
    endDate: '',
    document: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/insurance/by-lease');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const formData = new FormData();
      formData.append('leaseId', selectedItem.lease.id);
      formData.append('startDate', addForm.startDate);
      if (addForm.endDate) formData.append('endDate', addForm.endDate);
      if (addForm.document) formData.append('document', addForm.document);

      const response = await fetch('/api/insurance', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowAddModal(false);
        setSelectedItem(null);
        setAddForm({ startDate: new Date().toISOString().split('T')[0], endDate: '', document: null });
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'ajout de l'attestation");
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      alert("Erreur lors de l'ajout de l'attestation");
    }
  };

  const handleEditCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.latestCertificate) return;

    try {
      const formData = new FormData();
      if (editForm.startDate) formData.append('startDate', editForm.startDate);
      if (editForm.endDate) formData.append('endDate', editForm.endDate);
      if (editForm.document) formData.append('document', editForm.document);

      const response = await fetch(`/api/insurance/${selectedItem.latestCertificate.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setShowEditModal(false);
        setSelectedItem(null);
        setEditForm({ startDate: '', endDate: '', document: null });
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette attestation ?")) return;

    try {
      const response = await fetch(`/api/insurance/${certId}`, { method: 'DELETE' });
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

  const openAddModal = (item: LeaseInsuranceItem) => {
    setSelectedItem(item);
    setAddForm({ startDate: new Date().toISOString().split('T')[0], endDate: '', document: null });
    setShowAddModal(true);
  };

  const openEditModal = (item: LeaseInsuranceItem) => {
    if (!item.latestCertificate) return;
    setSelectedItem(item);
    setEditForm({
      startDate: item.latestCertificate.startDate.split('T')[0],
      endDate: item.latestCertificate.endDate?.split('T')[0] ?? '',
      document: null,
    });
    setShowEditModal(true);
  };

  const formatTenantName = (tenant: LeaseInsuranceItem['tenant']): string => {
    if (!tenant) return '—';
    const civility = tenant.civility ? `${tenant.civility} ` : '';
    return `${civility}${tenant.firstName} ${tenant.lastName.toUpperCase()}`;
  };

  const downloadRelanceMessage = (item: LeaseInsuranceItem) => {
    const tenant = item.tenant;
    const landlord = item.landlord;
    const property = item.property;

    const civility = tenant?.civility
      ? tenant.civility === 'M.'
        ? 'Monsieur'
        : 'Madame'
      : 'Madame, Monsieur';

    const tenantFullName = tenant
      ? `${civility} ${tenant.firstName} ${tenant.lastName.toUpperCase()}`
      : 'Madame, Monsieur';

    const propertyAddress = `${property.address}, ${property.postalCode} ${property.city}`;

    const isExpired = item.insuranceStatus === 'expired';
    const situationText = isExpired
      ? "l'attestation d'assurance habitation relative à ce bien est arrivée à expiration"
      : "nous ne disposons pas d'attestation d'assurance habitation pour ce bien";

    const message = `Objet : Demande de renouvellement d'attestation d'assurance habitation

${tenantFullName},

Je me permets de vous contacter concernant votre bail portant sur le bien situé au ${propertyAddress}.

En tant que propriétaire, je suis tenu(e) de disposer d'une attestation d'assurance habitation valide pour chaque logement loué. Or, il apparaît que ${situationText}.

Je vous serais reconnaissant(e) de bien vouloir me transmettre votre attestation d'assurance habitation en cours de validité dans les meilleurs délais, et au plus tard dans un délai de 8 jours à compter de la réception du présent message.

Sans retour de votre part dans ce délai, je me verrais contraint(e) de prendre les dispositions nécessaires.

Je reste à votre disposition pour tout renseignement complémentaire.

Cordialement,

${landlord.name}${landlord.email ? `\n${landlord.email}` : ''}`;

    const blob = new Blob([message], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const tenantLastName = tenant?.lastName?.toLowerCase() ?? 'locataire';
    a.href = url;
    a.download = `relance-assurance-${tenantLastName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (item: LeaseInsuranceItem) => {
    if (item.insuranceStatus === 'none') {
      return { className: 'bg-yellow-100 text-yellow-800', text: 'Aucune attestation' };
    }
    if (item.insuranceStatus === 'expired') {
      const days = Math.abs(item.daysUntilExpiry ?? 0);
      return { className: 'bg-red-100 text-red-800 font-semibold', text: `Expirée depuis ${days} j.` };
    }
    const days = item.daysUntilExpiry;
    if (days !== null && days <= 30) {
      return { className: 'bg-orange-100 text-orange-800', text: `Expire dans ${days} j.` };
    }
    return { className: 'bg-green-100 text-green-800', text: 'Valide' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const attentionCount = items.filter(
    (i) => i.insuranceStatus === 'expired' || i.insuranceStatus === 'none'
  ).length;

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
                ← Retour au tableau de bord
              </button>
              <h1 className="text-xl font-bold">Attestations d'assurance</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
            <div className="text-sm text-gray-600">Baux actifs</div>
          </div>
          <div className={`p-4 rounded-lg shadow ${attentionCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${attentionCount > 0 ? 'text-red-800' : 'text-green-800'}`}>
              {attentionCount}
            </div>
            <div className={`text-sm ${attentionCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {attentionCount > 0 ? 'Attestations manquantes ou expirées' : 'Toutes les attestations sont à jour'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {items.filter((i) => i.insuranceStatus === 'valid').length}
            </div>
            <div className="text-sm text-gray-600">Attestations valides</div>
          </div>
        </div>

        {/* Leases Table */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Aucun bail actif trouvé.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bien</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locataire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'émission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const badge = getStatusBadge(item);
                  const needsAttention =
                    item.insuranceStatus === 'expired' || item.insuranceStatus === 'none';

                  return (
                    <tr
                      key={item.lease.id}
                      className={`hover:bg-gray-50 ${needsAttention ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.property.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.property.address}, {item.property.postalCode} {item.property.city}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatTenantName(item.tenant)}</div>
                        {item.tenant?.email && (
                          <div className="text-xs text-gray-500">{item.tenant.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.latestCertificate
                          ? new Date(item.latestCertificate.startDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.latestCertificate?.endDate
                          ? new Date(item.latestCertificate.endDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.latestCertificate?.documentPath && (
                            <a
                              href={item.latestCertificate.documentPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir le document"
                            >
                              📄
                            </a>
                          )}
                          {item.latestCertificate ? (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                ✏️ Modifier
                              </button>
                              <button
                                onClick={() => openAddModal(item)}
                                className="text-green-600 hover:text-green-900"
                                title="Ajouter une nouvelle attestation"
                              >
                                + Nouvelle
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openAddModal(item)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              + Ajouter
                            </button>
                          )}
                          {needsAttention && (
                            <button
                              onClick={() => downloadRelanceMessage(item)}
                              className="text-orange-600 hover:text-orange-900 font-medium"
                              title="Télécharger le message de relance (.txt)"
                            >
                              📨 Relance
                            </button>
                          )}
                          {item.latestCertificate && (
                            <button
                              onClick={() =>
                                handleDeleteCertificate(item.latestCertificate!.id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Certificate Modal */}
      {showAddModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">Ajouter une attestation d'assurance</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedItem.property.name} — {formatTenantName(selectedItem.tenant)}
              </p>
              <form onSubmit={handleAddCertificate}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'émission *
                    </label>
                    <input
                      type="date"
                      required
                      value={addForm.startDate}
                      onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      value={addForm.endDate}
                      onChange={(e) => setAddForm({ ...addForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document (PDF ou image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setAddForm({ ...addForm, document: e.target.files?.[0] || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedItem(null);
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

      {/* Edit Certificate Modal */}
      {showEditModal && selectedItem?.latestCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">Modifier l'attestation</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedItem.property.name} — {formatTenantName(selectedItem.tenant)}
              </p>
              <form onSubmit={handleEditCertificate}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'émission
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remplacer le document (optionnel)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setEditForm({ ...editForm, document: e.target.files?.[0] || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedItem(null);
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
