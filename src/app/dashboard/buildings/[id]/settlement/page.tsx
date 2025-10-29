'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Property {
  id: string;
  name: string;
}

interface SettlementResult {
  propertyId: string;
  buildingId: string;
  referenceDate: string;
  periodStart: string;
  periodEnd: string;
  categories: CategoryDetail[];
  totalChargesActual: number;
  totalChargesProvisional: number;
  balance: number;
  newMonthlyCharges: number;
  warnings: string[];
}

interface CategoryDetail {
  category: string;
  categoryLabel: string;
  documents: {
    id: string;
    date: string;
    description: string;
    amount: number;
    documentPath?: string;
  }[];
  totalAmount: number;
  percentage: number;
  propertyShare: number;
  calculationMethod?: 'PERCENTAGE' | 'WATER_CONSUMPTION';
  waterDetails?: {
    propertyConsumption: number;
    buildingTotalConsumption: number;
    dynamicPercentage: number;
    calculationMethod: 'ACTUAL' | 'EXTRAPOLATED';
    periodStart: string;
    periodEnd: string;
  };
}

export default function ChargeSettlementPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [provisionalCharges, setProvisionalCharges] = useState('');
  const [settlement, setSettlement] = useState<SettlementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [buildingLoading, setBuildingLoading] = useState(true);

  useEffect(() => {
    fetchBuilding();
  }, [buildingId]);

  const fetchBuilding = async () => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching building:', error);
    } finally {
      setBuildingLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedPropertyId || !provisionalCharges) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/buildings/${buildingId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          provisionalChargesPaid: parseFloat(provisionalCharges),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettlement(data);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error calculating settlement:', error);
      alert('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleExportTxt = () => {
    if (!settlement) return;

    const property = properties.find((p) => p.id === settlement.propertyId);
    if (!property) return;

    // Create text content
    let content = `RÉGULARISATION DES CHARGES\n`;
    content += `=`.repeat(80) + '\n\n';
    content += `Bien: ${property.name}\n`;
    content += `Période: du ${new Date(settlement.periodStart).toLocaleDateString('fr-FR')} au ${new Date(settlement.periodEnd).toLocaleDateString('fr-FR')}\n\n`;

    content += `DÉTAIL DES CHARGES PAR CATÉGORIE\n`;
    content += `${'-'.repeat(80)}\n\n`;

    settlement.categories.forEach((cat) => {
      content += `${cat.categoryLabel.toUpperCase()}\n`;
      content += `  Total des factures: ${cat.totalAmount.toFixed(2)} €\n`;

      if (cat.calculationMethod === 'WATER_CONSUMPTION' && cat.waterDetails) {
        content += `  Consommation du bien: ${cat.waterDetails.propertyConsumption.toFixed(2)} m³/an (${cat.waterDetails.calculationMethod === 'ACTUAL' ? 'relevés réels' : 'extrapolé'})\n`;
        content += `  Consommation totale immeuble: ${cat.waterDetails.buildingTotalConsumption.toFixed(2)} m³/an\n`;
        content += `  Pourcentage calculé: ${cat.waterDetails.dynamicPercentage.toFixed(2)}%\n`;
      } else {
        content += `  Pourcentage configuré: ${cat.percentage.toFixed(2)}%\n`;
      }

      content += `  Part du bien: ${cat.propertyShare.toFixed(2)} €\n`;
      content += `\n  Documents:\n`;

      cat.documents.forEach((doc) => {
        content += `    - ${new Date(doc.date).toLocaleDateString('fr-FR')}: ${doc.description} (${doc.amount.toFixed(2)} €)\n`;
        if (doc.documentPath) {
          content += `      📎 ${window.location.origin}${doc.documentPath}\n`;
        }
      });

      content += `\n`;
    });

    content += `${'-'.repeat(80)}\n`;
    content += `TOTAL CHARGES RÉELLES (12 mois): ${settlement.totalChargesActual.toFixed(2)} €\n`;
    content += `TOTAL CHARGES PROVISIONNELLES PAYÉES (12 mois): ${settlement.totalChargesProvisional.toFixed(2)} €\n`;
    content += `\n`;

    if (settlement.balance < 0) {
      content += `❌ SOLDE DÛ PAR LE LOCATAIRE: ${Math.abs(settlement.balance).toFixed(2)} €\n`;
    } else if (settlement.balance > 0) {
      content += `✅ SOLDE DÛ AU LOCATAIRE (trop-perçu): ${settlement.balance.toFixed(2)} €\n`;
    } else {
      content += `✓ SOLDE: 0 € (Comptes équilibrés)\n`;
    }

    content += `\n`;
    content += `NOUVELLES CHARGES MENSUELLES: ${settlement.newMonthlyCharges.toFixed(2)} €/mois\n`;
    content += `\n`;

    if (settlement.warnings.length > 0) {
      content += `⚠️  AVERTISSEMENTS:\n`;
      settlement.warnings.forEach((w) => {
        content += `  - ${w}\n`;
      });
      content += `\n`;
    }

    content += `${'-'.repeat(80)}\n`;
    content += `Document généré le ${new Date().toLocaleString('fr-FR')}\n`;

    // Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regularisation-charges-${property.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (buildingLoading) return <div className="p-8">Chargement...</div>;

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
          <h1 className="text-3xl font-bold text-gray-900">
            Régularisation des charges
          </h1>
          <p className="text-gray-600 mt-2">
            Calculez la régularisation annuelle des charges pour un bien
          </p>
        </div>

        {/* Calculation Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Paramètres du calcul</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bien concerné *
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Sélectionnez un bien --</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charges provisionnelles payées (12 mois) *
              </label>
              <input
                type="number"
                step="0.01"
                value={provisionalCharges}
                onChange={(e) => setProvisionalCharges(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ex: 600.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant total des charges provisionnelles payées sur les 12 derniers mois
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCalculate}
              disabled={!selectedPropertyId || !provisionalCharges || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calcul en cours...' : 'Calculer la régularisation'}
            </button>
          </div>
        </div>

        {/* Results */}
        {settlement && (
          <div className="space-y-6">
            {/* Warnings */}
            {settlement.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Avertissements</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {settlement.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Categories Detail */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Détail par catégorie</h2>
                <p className="text-sm text-gray-600">
                  Période: du {new Date(settlement.periodStart).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(settlement.periodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-6 space-y-6">
                {settlement.categories.map((cat) => (
                  <div key={cat.category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{cat.categoryLabel}</h3>
                        {cat.waterDetails && (
                          <div className="text-sm text-blue-600 mt-1">
                            💧 Calculé selon consommation réelle:{' '}
                            {cat.waterDetails.propertyConsumption.toFixed(2)} m³/an (
                            {cat.waterDetails.calculationMethod === 'ACTUAL' ? 'relevés réels' : 'extrapolé'})
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {cat.propertyShare.toFixed(2)} €
                        </div>
                        <div className="text-sm text-gray-600">
                          {cat.percentage.toFixed(2)}% de {cat.totalAmount.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {cat.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <div>
                            <span className="text-gray-600">
                              {new Date(doc.date).toLocaleDateString('fr-FR')}
                            </span>
                            {' - '}
                            <span>{doc.description}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{doc.amount.toFixed(2)} €</span>
                            {doc.documentPath && (
                              <a
                                href={doc.documentPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                📎
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Résumé</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Charges réelles (12 mois):</span>
                  <span className="font-bold">{settlement.totalChargesActual.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Charges provisionnelles payées (12 mois):</span>
                  <span className="font-bold">{settlement.totalChargesProvisional.toFixed(2)} €</span>
                </div>
                <div
                  className={`flex justify-between py-2 text-lg ${
                    settlement.balance < 0
                      ? 'text-red-600'
                      : settlement.balance > 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="font-semibold">
                    {settlement.balance < 0
                      ? 'Solde dû par le locataire:'
                      : settlement.balance > 0
                      ? 'Solde dû au locataire (trop-perçu):'
                      : 'Solde:'}
                  </span>
                  <span className="font-bold">{Math.abs(settlement.balance).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 bg-blue-50 px-4 rounded">
                  <span className="font-semibold">Nouvelles charges mensuelles:</span>
                  <span className="font-bold text-blue-600">
                    {settlement.newMonthlyCharges.toFixed(2)} €/mois
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleExportTxt}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
                >
                  📄 Télécharger le détail (.txt) pour le locataire
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
