'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  InventoryType,
  ItemType,
  RoomAspect,
  Condition,
  CONDITION_LABELS,
  ROOM_ASPECT_LABELS,
  STANDARD_ROOM_ASPECTS,
} from '@/features/inventory/domain/InventoryTypes';

interface Property {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  items: {
    id: string;
    type: string;
    name: string;
  }[];
}

interface Inventory {
  id: string;
  type: string;
  date: string;
  lease: {
    tenant: {
      firstName: string;
      lastName: string;
    };
  } | null;
  template: {
    name: string;
  } | null;
  assessments: Assessment[];
}

interface Assessment {
  id: string;
  itemName: string;
  aspect: string;
  condition: string;
  comments: string | null;
}

export default function PropertyInventoriesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    type: 'ENTRY' as 'ENTRY' | 'EXIT',
    date: new Date().toISOString().split('T')[0],
    templateId: '',
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      const [propRes, invRes, templRes] = await Promise.all([
        fetch(`/api/properties/${propertyId}`),
        fetch(`/api/properties/${propertyId}/inventories`),
        fetch('/api/inventory-templates'),
      ]);

      if (propRes.ok) {
        const propData = await propRes.json();
        setProperty(propData);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventories(invData);
      }
      if (templRes.ok) {
        const templData = await templRes.json();
        setTemplates(templData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/properties/${propertyId}/inventories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const newInventory = await response.json();
        await fetchData();
        setShowCreateModal(false);
        // Redirect to edit page
        router.push(`/dashboard/inventories/${newInventory.id}/edit`);
      }
    } catch (error) {
      console.error('Error creating inventory:', error);
    }
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
                États des lieux - {property.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Gérer les états des lieux d'entrée et de sortie
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Nouvel état des lieux
            </button>
          </div>
        </div>

        {/* Inventories List */}
        {inventories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun état des lieux pour ce bien.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer le premier état des lieux
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventories.map((inventory) => (
              <div
                key={inventory.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/inventories/${inventory.id}/edit`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        inventory.type === 'ENTRY'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {inventory.type === 'ENTRY' ? '🔵 Entrée' : '🔴 Sortie'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(inventory.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {inventory.lease?.tenant && (
                  <div className="text-sm text-gray-700 mb-2">
                    Locataire: {inventory.lease.tenant.firstName}{' '}
                    {inventory.lease.tenant.lastName}
                  </div>
                )}

                {inventory.template && (
                  <div className="text-sm text-gray-600 mb-2">
                    Template: {inventory.template.name}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {inventory.assessments.length} évaluation(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Inventory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Nouvel état des lieux</h3>
              <form onSubmit={handleCreateInventory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value as 'ENTRY' | 'EXIT' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ENTRY">État des lieux d'entrée</option>
                    <option value="EXIT">État des lieux de sortie</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template (optionnel)
                  </label>
                  <select
                    value={createForm.templateId}
                    onChange={(e) => setCreateForm({ ...createForm, templateId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Aucun template --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.items.length} éléments)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le template pré-remplit les pièces et éléments à évaluer
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Créer et remplir
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
