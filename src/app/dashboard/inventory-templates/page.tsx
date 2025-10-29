'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TemplateItem {
  id?: string;
  type: 'ROOM' | 'ITEM';
  name: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
}

export default function InventoryTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as TemplateItem[],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/inventory-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTemplates();
        setShowModal(false);
        setFormData({ name: '', description: '', items: [] });
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const addItem = (type: 'ROOM' | 'ITEM') => {
    setFormData({
      ...formData,
      items: [...formData.items, { type, name: '' }],
    });
  };

  const updateItem = (index: number, name: string) => {
    const newItems = [...formData.items];
    newItems[index].name = name;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Templates d'état des lieux
            </h1>
            <p className="text-gray-600 mt-2">
              Créez des templates réutilisables pour vos états des lieux
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nouveau template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun template créé.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Créer votre premier template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  {template.items.length} élément(s)
                </div>
                <div className="mt-3 text-xs space-y-1">
                  {template.items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded ${
                        item.type === 'ROOM' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.type === 'ROOM' ? 'Pièce' : 'Élément'}
                      </span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                  {template.items.length > 5 && (
                    <div className="text-gray-400">
                      ... et {template.items.length - 5} autre(s)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Nouveau template d'état des lieux</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du template *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: Appartement T3 standard"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pièces et éléments
                  </label>
                  <div className="space-y-2 mb-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <span className={`px-3 py-2 rounded text-sm ${
                          item.type === 'ROOM' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type === 'ROOM' ? 'Pièce' : 'Élément'}
                        </span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder={item.type === 'ROOM' ? 'Ex: Salle de bain' : 'Ex: Balcon'}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addItem('ROOM')}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                    >
                      + Ajouter une pièce
                    </button>
                    <button
                      type="button"
                      onClick={() => addItem('ITEM')}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      + Ajouter un élément
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ name: '', description: '', items: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || formData.items.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Créer le template
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
