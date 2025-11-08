'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Landlord {
  id: string;
  name: string;
  type: 'NATURAL_PERSON' | 'LEGAL_ENTITY';
  address: string;
  email: string | null;
  phone: string | null;
  siret: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  note: string | null;
  properties: any[];
}

export default function LandlordsPage() {
  const router = useRouter();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<Landlord | null>(null);
  const [deletingLandlord, setDeletingLandlord] = useState<Landlord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'NATURAL_PERSON' as 'NATURAL_PERSON' | 'LEGAL_ENTITY',
    address: '',
    email: '',
    phone: '',
    siret: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    note: '',
  });

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      const response = await fetch('/api/landlords');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch landlords');
      }
      const data = await response.json();
      setLandlords(data);
    } catch (error) {
      console.error('Error fetching landlords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      type: 'NATURAL_PERSON',
      address: '',
      email: '',
      phone: '',
      siret: '',
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      note: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (landlord: Landlord) => {
    setFormData({
      name: landlord.name,
      type: landlord.type,
      address: landlord.address,
      email: landlord.email || '',
      phone: landlord.phone || '',
      siret: landlord.siret || '',
      managerName: landlord.managerName || '',
      managerEmail: landlord.managerEmail || '',
      managerPhone: landlord.managerPhone || '',
      note: landlord.note || '',
    });
    setEditingLandlord(landlord);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setEditingLandlord(null);
    setDeletingLandlord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      address: formData.address,
      email: formData.email || null,
      phone: formData.phone || null,
      siret: formData.type === 'LEGAL_ENTITY' ? formData.siret || null : null,
      managerName: formData.type === 'LEGAL_ENTITY' ? formData.managerName || null : null,
      managerEmail: formData.type === 'LEGAL_ENTITY' ? formData.managerEmail || null : null,
      managerPhone: formData.type === 'LEGAL_ENTITY' ? formData.managerPhone || null : null,
      note: formData.note || null,
    };

    try {
      const url = editingLandlord
        ? `/api/landlords/${editingLandlord.id}`
        : '/api/landlords';

      const method = editingLandlord ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        handleCloseModals();
        fetchLandlords();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving landlord:', error);
      alert('Échec de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (!deletingLandlord) return;

    try {
      const response = await fetch(`/api/landlords/${deletingLandlord.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        handleCloseModals();
        fetchLandlords();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting landlord:', error);
      alert('Échec de la suppression');
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
                ← Retour au tableau de bord
              </a>
              <h1 className="text-xl font-bold">Propriétaires</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Liste des propriétaires</h2>
            <button
              onClick={handleOpenAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Ajouter un propriétaire
            </button>
          </div>

          {landlords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun propriétaire enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propriétés</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {landlords.map((landlord) => (
                    <tr key={landlord.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{landlord.name}</div>
                        {landlord.siret && <div className="text-xs text-gray-500">SIRET: {landlord.siret}</div>}
                        {landlord.managerName && <div className="text-xs text-gray-500">Gérant: {landlord.managerName}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          landlord.type === 'NATURAL_PERSON'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {landlord.type === 'NATURAL_PERSON' ? 'Personne physique' : 'Personne morale'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{landlord.email || '-'}</div>
                        <div className="text-xs text-gray-500">{landlord.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{landlord.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {landlord.properties?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditModal(landlord)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeletingLandlord(landlord)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingLandlord) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingLandlord ? 'Modifier le propriétaire' : 'Ajouter un propriétaire'}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={handleCloseModals}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de propriétaire *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="NATURAL_PERSON">Personne physique</option>
                    <option value="LEGAL_ENTITY">Personne morale (SCI, etc.)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom {formData.type === 'LEGAL_ENTITY' ? 'de la société' : ''} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {formData.type === 'LEGAL_ENTITY' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SIRET *
                      </label>
                      <input
                        type="text"
                        value={formData.siret}
                        onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={formData.type === 'LEGAL_ENTITY'}
                      />
                    </div>

                    <div className="col-span-2 border-t pt-4 mt-2">
                      <h4 className="font-medium text-gray-900 mb-3">Informations du gérant</h4>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du gérant
                      </label>
                      <input
                        type="text"
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email du gérant
                      </label>
                      <input
                        type="email"
                        value={formData.managerEmail}
                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="gerant@exemple.fr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone du gérant
                      </label>
                      <input
                        type="tel"
                        value={formData.managerPhone}
                        onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0612345678"
                      />
                    </div>

                    <div className="col-span-2 border-t pt-4 mt-2">
                      <h4 className="font-medium text-gray-900 mb-3">Coordonnées de la société</h4>
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {formData.type === 'LEGAL_ENTITY' ? 'de la société' : ''}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone {formData.type === 'LEGAL_ENTITY' ? 'de la société' : ''}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Markdown supporté)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={4}
                  placeholder="## Titre&#10;- Point 1&#10;- Point 2&#10;&#10;**Important:** texte en gras"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez Markdown pour formater votre note (titres, listes, gras, italique, etc.)
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={handleCloseModals}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingLandlord ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLandlord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-600">Supprimer le propriétaire</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={handleCloseModals}
              >
                ✕
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer le propriétaire <strong>{deletingLandlord.name}</strong> ?
            </p>

            {deletingLandlord.properties && deletingLandlord.properties.length > 0 && (
              <p className="text-red-600 text-sm mb-4">
                ⚠️ Attention : Ce propriétaire a {deletingLandlord.properties.length} propriété(s).
                Elles seront également supprimées.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={handleCloseModals}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
