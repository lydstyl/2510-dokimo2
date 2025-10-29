'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Condition,
  RoomAspect,
  CONDITION_LABELS,
  ROOM_ASPECT_LABELS,
  STANDARD_ROOM_ASPECTS,
} from '@/features/inventory/domain/InventoryTypes';

interface TemplateItem {
  id: string;
  type: 'ROOM' | 'ITEM';
  name: string;
}

interface Assessment {
  itemName: string;
  aspect: string;
  condition: string;
  comments: string;
}

interface Inventory {
  id: string;
  type: string;
  date: string;
  property: {
    name: string;
  };
  template: {
    items: TemplateItem[];
  } | null;
  assessments: Assessment[];
}

export default function EditInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params.id as string;

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [assessments, setAssessments] = useState<Record<string, Assessment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [inventoryId]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventories/${inventoryId}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);

        // Load items from template or create default
        const itemsToUse = data.template?.items || [];
        setItems(itemsToUse);

        // Load existing assessments
        const assessmentMap: Record<string, Assessment> = {};
        data.assessments.forEach((a: Assessment) => {
          const key = `${a.itemName}-${a.aspect}`;
          assessmentMap[key] = a;
        });
        setAssessments(assessmentMap);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentKey = (itemName: string, aspect: string) => `${itemName}-${aspect}`;

  const getCondition = (itemName: string, aspect: string): string => {
    const key = getAssessmentKey(itemName, aspect);
    return assessments[key]?.condition || '';
  };

  const getComments = (itemName: string, aspect: string): string => {
    const key = getAssessmentKey(itemName, aspect);
    return assessments[key]?.comments || '';
  };

  const handleConditionChange = async (
    itemName: string,
    aspect: string,
    condition: string
  ) => {
    const key = getAssessmentKey(itemName, aspect);
    const newAssessment = {
      ...assessments[key],
      itemName,
      aspect,
      condition,
      comments: assessments[key]?.comments || '',
    };

    setAssessments({
      ...assessments,
      [key]: newAssessment,
    });

    // Auto-save
    try {
      await fetch(`/api/inventories/${inventoryId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          aspect,
          condition,
          comments: newAssessment.comments,
        }),
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const handleCommentsChange = async (
    itemName: string,
    aspect: string,
    comments: string
  ) => {
    const key = getAssessmentKey(itemName, aspect);
    const currentCondition = assessments[key]?.condition || '';

    if (!currentCondition) return; // Only save if condition is set

    const newAssessment = {
      ...assessments[key],
      itemName,
      aspect,
      condition: currentCondition,
      comments,
    };

    setAssessments({
      ...assessments,
      [key]: newAssessment,
    });

    // Auto-save after delay
    setTimeout(async () => {
      try {
        await fetch(`/api/inventories/${inventoryId}/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName,
            aspect,
            condition: currentCondition,
            comments,
          }),
        });
      } catch (error) {
        console.error('Error saving comments:', error);
      }
    }, 1000);
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!inventory) return <div className="p-8">État des lieux introuvable</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/properties/${inventory.property}/inventories`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour aux états des lieux
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {inventory.type === 'ENTRY'
                  ? 'État des lieux d\'entrée'
                  : 'État des lieux de sortie'}
              </h1>
              <p className="text-gray-600 mt-1">
                {inventory.property.name} - {new Date(inventory.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Légende des états:</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded font-medium text-sm ${getConditionColor(key as Condition)}`}>
                  {key}
                </span>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Forms */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              Aucun élément à évaluer. Utilisez un template ou ajoutez des éléments manuellement.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow">
                <div className="p-4 bg-blue-50 border-b">
                  <h3 className="font-semibold text-lg">
                    {item.name}
                    <span className="ml-3 text-sm text-gray-600">
                      ({item.type === 'ROOM' ? 'Pièce' : 'Élément'})
                    </span>
                  </h3>
                </div>
                <div className="p-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">Aspect</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-700">État</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-700">Commentaires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.type === 'ROOM' ? STANDARD_ROOM_ASPECTS : [RoomAspect.GENERAL]).map((aspect) => (
                        <tr key={aspect} className="border-b">
                          <td className="py-3 text-sm font-medium text-gray-900">
                            {ROOM_ASPECT_LABELS[aspect]}
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center gap-2">
                              {Object.keys(CONDITION_LABELS).map((cond) => (
                                <button
                                  key={cond}
                                  onClick={() => handleConditionChange(item.name, aspect, cond)}
                                  className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                                    getCondition(item.name, aspect) === cond
                                      ? getConditionColor(cond as Condition)
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {cond}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <input
                              type="text"
                              value={getComments(item.name, aspect)}
                              onChange={(e) =>
                                handleCommentsChange(item.name, aspect, e.target.value)
                              }
                              placeholder="Commentaires optionnels"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push(`/dashboard/properties/${inventory.property}/inventories`)}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
          >
            ✓ Terminer et enregistrer
          </button>
        </div>
      </div>
    </main>
  );
}

function getConditionColor(condition: Condition): string {
  switch (condition) {
    case Condition.TB:
      return 'bg-green-600 text-white';
    case Condition.B:
      return 'bg-green-400 text-white';
    case Condition.M:
      return 'bg-orange-500 text-white';
    case Condition.TM:
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
